import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import OpenAI from "openai";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { sql } from "drizzle-orm";
import { db } from "./db";
import {
  insertPetSchema,
  insertHealthRecordSchema,
  insertMedicationSchema,
  insertActivitySchema,
  insertActivityGoalSchema,
  insertNutritionLogSchema,
  insertHydrationLogSchema,
  insertBehaviorLogSchema,
  insertExpenseSchema,
  insertEmergencyContactSchema,
  insertReminderSchema,
  insertLocalServiceSchema,
  insertServiceReviewSchema,
  insertForumPostSchema,
  insertForumCommentSchema,
} from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  
  registerChatRoutes(app);
  registerImageRoutes(app);
  registerObjectStorageRoutes(app);

  app.get("/api/config/maps", isAuthenticated, (req, res) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Google Maps API key not configured" });
    }
    res.json({ apiKey });
  });

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile
  const profileUpdateSchema = z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().max(100).optional(),
  });

  app.patch("/api/auth/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate input
      const parsed = profileUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid profile data", errors: parsed.error.errors });
      }
      
      const { firstName, lastName } = parsed.data;
      
      // Build update object only with provided fields
      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (firstName !== undefined) {
        updateData.firstName = firstName.trim() || null;
      }
      if (lastName !== undefined) {
        updateData.lastName = lastName.trim() || null;
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.delete("/api/auth/account", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteUser(userId);
      
      // Destroy session after account deletion
      req.logout((err: any) => {
        if (err) {
          console.error("Error during logout after account deletion:", err);
        }
        req.session.destroy((destroyErr: any) => {
          if (destroyErr) {
            console.error("Error destroying session:", destroyErr);
          }
          res.json({ message: "Account deleted successfully" });
        });
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  app.get("/api/pets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pets = await storage.getPetsByUser(userId);
      res.json(pets);
    } catch (error) {
      console.error("Error fetching pets:", error);
      res.status(500).json({ message: "Failed to fetch pets" });
    }
  });

  app.get("/api/pets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const pet = await storage.getPet(id);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      if (pet.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      res.json(pet);
    } catch (error) {
      console.error("Error fetching pet:", error);
      res.status(500).json({ message: "Failed to fetch pet" });
    }
  });

  app.post("/api/pets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // App is fully free — no pet limit, no premium gating.
      void user;
      const parsed = insertPetSchema.parse({ ...req.body, userId });
      const pet = await storage.createPet(parsed);
      res.status(201).json(pet);
    } catch (error) {
      console.error("Error creating pet:", error);
      res.status(400).json({ message: "Invalid pet data" });
    }
  });

  app.patch("/api/pets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getPet(id);
      if (!existing || existing.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const { userId, id: bodyId, ...safeData } = req.body;
      const pet = await storage.updatePet(id, safeData);
      res.json(pet);
    } catch (error) {
      console.error("Error updating pet:", error);
      res.status(500).json({ message: "Failed to update pet" });
    }
  });

  app.delete("/api/pets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getPet(id);
      if (!existing || existing.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }
      await storage.deletePet(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting pet:", error);
      res.status(500).json({ message: "Failed to delete pet" });
    }
  });

  app.get("/api/health-records", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pets = await storage.getPetsByUser(userId);
      const allRecords = await Promise.all(
        pets.map(pet => storage.getHealthRecordsByPet(pet.id))
      );
      res.json(allRecords.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error("Error fetching all health records:", error);
      res.status(500).json({ message: "Failed to fetch health records" });
    }
  });

  app.get("/api/health-records/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const record = await storage.getHealthRecord(id);
      if (!record) {
        return res.status(404).json({ message: "Health record not found" });
      }
      const pet = await storage.getPet(record.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error fetching health record:", error);
      res.status(500).json({ message: "Failed to fetch health record" });
    }
  });

  app.get("/api/medications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pets = await storage.getPetsByUser(userId);
      const allMeds = await Promise.all(
        pets.map(pet => storage.getMedicationsByPet(pet.id))
      );
      res.json(allMeds.flat());
    } catch (error) {
      console.error("Error fetching all medications:", error);
      res.status(500).json({ message: "Failed to fetch medications" });
    }
  });

  app.get("/api/medications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const medication = await storage.getMedication(id);
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      const pet = await storage.getPet(medication.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      res.json(medication);
    } catch (error) {
      console.error("Error fetching medication:", error);
      res.status(500).json({ message: "Failed to fetch medication" });
    }
  });

  app.get("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pets = await storage.getPetsByUser(userId);
      const allActivities = await Promise.all(
        pets.map(pet => storage.getActivitiesByPet(pet.id))
      );
      res.json(allActivities.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error("Error fetching all activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/activities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const activity = await storage.getActivity(id);
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      const pet = await storage.getPet(activity.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      res.json(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.get("/api/activity-goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pets = await storage.getPetsByUser(userId);
      const allGoals = await Promise.all(
        pets.map(pet => storage.getActivityGoalsByPet(pet.id))
      );
      res.json(allGoals.flat());
    } catch (error) {
      console.error("Error fetching all activity goals:", error);
      res.status(500).json({ message: "Failed to fetch activity goals" });
    }
  });

  app.get("/api/pets/:petId/health-records", isAuthenticated, async (req: any, res) => {
    try {
      const petId = parseInt(req.params.petId);
      const pet = await storage.getPet(petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const records = await storage.getHealthRecordsByPet(petId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching health records:", error);
      res.status(500).json({ message: "Failed to fetch health records" });
    }
  });

  app.post("/api/health-records", isAuthenticated, async (req: any, res) => {
    try {
      const pet = await storage.getPet(req.body.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const parsed = insertHealthRecordSchema.parse(req.body);
      const record = await storage.createHealthRecord(parsed);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating health record:", error);
      res.status(400).json({ message: "Invalid health record data" });
    }
  });

  app.patch("/api/health-records/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getHealthRecord(id);
      if (!existing) {
        return res.status(404).json({ message: "Health record not found" });
      }
      const pet = await storage.getPet(existing.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { petId, id: bodyId, ...safeData } = req.body;
      const record = await storage.updateHealthRecord(id, safeData);
      res.json(record);
    } catch (error) {
      console.error("Error updating health record:", error);
      res.status(500).json({ message: "Failed to update health record" });
    }
  });

  app.delete("/api/health-records/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getHealthRecord(id);
      if (!existing) {
        return res.status(404).json({ message: "Health record not found" });
      }
      const pet = await storage.getPet(existing.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteHealthRecord(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting health record:", error);
      res.status(500).json({ message: "Failed to delete health record" });
    }
  });

  app.get("/api/pets/:petId/medications", isAuthenticated, async (req: any, res) => {
    try {
      const petId = parseInt(req.params.petId);
      const pet = await storage.getPet(petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const medications = await storage.getMedicationsByPet(petId);
      res.json(medications);
    } catch (error) {
      console.error("Error fetching medications:", error);
      res.status(500).json({ message: "Failed to fetch medications" });
    }
  });

  app.post("/api/medications", isAuthenticated, async (req: any, res) => {
    try {
      const pet = await storage.getPet(req.body.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const parsed = insertMedicationSchema.parse(req.body);
      const medication = await storage.createMedication(parsed);
      res.status(201).json(medication);
    } catch (error) {
      console.error("Error creating medication:", error);
      res.status(400).json({ message: "Invalid medication data" });
    }
  });

  app.patch("/api/medications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getMedication(id);
      if (!existing) {
        return res.status(404).json({ message: "Medication not found" });
      }
      const pet = await storage.getPet(existing.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { petId, id: bodyId, ...safeData } = req.body;
      const medication = await storage.updateMedication(id, safeData);
      res.json(medication);
    } catch (error) {
      console.error("Error updating medication:", error);
      res.status(500).json({ message: "Failed to update medication" });
    }
  });

  app.delete("/api/medications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getMedication(id);
      if (!existing) {
        return res.status(404).json({ message: "Medication not found" });
      }
      const pet = await storage.getPet(existing.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteMedication(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting medication:", error);
      res.status(500).json({ message: "Failed to delete medication" });
    }
  });

  app.get("/api/pets/:petId/activities", isAuthenticated, async (req: any, res) => {
    try {
      const petId = parseInt(req.params.petId);
      const pet = await storage.getPet(petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const activities = await storage.getActivitiesByPet(petId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const pet = await storage.getPet(req.body.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const parsed = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(parsed);
      res.status(201).json(activity);
    } catch (error) {
      console.error("Error creating activity:", error);
      res.status(400).json({ message: "Invalid activity data" });
    }
  });

  app.patch("/api/activities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getActivity(id);
      if (!existing) {
        return res.status(404).json({ message: "Activity not found" });
      }
      const pet = await storage.getPet(existing.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { petId, id: bodyId, ...safeData } = req.body;
      const activity = await storage.updateActivity(id, safeData);
      res.json(activity);
    } catch (error) {
      console.error("Error updating activity:", error);
      res.status(500).json({ message: "Failed to update activity" });
    }
  });

  app.delete("/api/activities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getActivity(id);
      if (!existing) {
        return res.status(404).json({ message: "Activity not found" });
      }
      const pet = await storage.getPet(existing.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteActivity(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting activity:", error);
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  app.get("/api/pets/:petId/activity-goals", isAuthenticated, async (req: any, res) => {
    try {
      const petId = parseInt(req.params.petId);
      const pet = await storage.getPet(petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const goals = await storage.getActivityGoalsByPet(petId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching activity goals:", error);
      res.status(500).json({ message: "Failed to fetch activity goals" });
    }
  });

  app.post("/api/activity-goals", isAuthenticated, async (req: any, res) => {
    try {
      const pet = await storage.getPet(req.body.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const parsed = insertActivityGoalSchema.parse(req.body);
      const goal = await storage.createActivityGoal(parsed);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error creating activity goal:", error);
      res.status(400).json({ message: "Invalid activity goal data" });
    }
  });

  app.get("/api/pets/:petId/nutrition-logs", isAuthenticated, async (req: any, res) => {
    try {
      const petId = parseInt(req.params.petId);
      const pet = await storage.getPet(petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const logs = await storage.getNutritionLogsByPet(petId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching nutrition logs:", error);
      res.status(500).json({ message: "Failed to fetch nutrition logs" });
    }
  });

  app.get("/api/nutrition-logs", isAuthenticated, async (req: any, res) => {
    try {
      const logs = await storage.getNutritionLogsByUser(req.user.claims.sub);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching nutrition logs:", error);
      res.status(500).json({ message: "Failed to fetch nutrition logs" });
    }
  });

  app.get("/api/nutrition-logs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const log = await storage.getNutritionLog(id);
      if (!log) {
        return res.status(404).json({ message: "Nutrition log not found" });
      }
      const pet = await storage.getPet(log.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      res.json(log);
    } catch (error) {
      console.error("Error fetching nutrition log:", error);
      res.status(500).json({ message: "Failed to fetch nutrition log" });
    }
  });

  app.post("/api/nutrition-logs", isAuthenticated, async (req: any, res) => {
    try {
      const pet = await storage.getPet(req.body.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const parsed = insertNutritionLogSchema.parse(req.body);
      const log = await storage.createNutritionLog(parsed);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating nutrition log:", error);
      res.status(400).json({ message: "Invalid nutrition log data" });
    }
  });

  app.patch("/api/nutrition-logs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getNutritionLog(id);
      if (!existing) {
        return res.status(404).json({ message: "Nutrition log not found" });
      }
      const pet = await storage.getPet(existing.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const allowedFields = ["mealType", "foodName", "amount", "unit", "calories", "date", "notes"];
      const updateData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      const updated = await storage.updateNutritionLog(id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating nutrition log:", error);
      res.status(500).json({ message: "Failed to update nutrition log" });
    }
  });

  app.delete("/api/nutrition-logs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getNutritionLog(id);
      if (!existing) {
        return res.status(404).json({ message: "Nutrition log not found" });
      }
      const pet = await storage.getPet(existing.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteNutritionLog(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting nutrition log:", error);
      res.status(500).json({ message: "Failed to delete nutrition log" });
    }
  });

  app.get("/api/pets/:petId/hydration-logs", isAuthenticated, async (req: any, res) => {
    try {
      const petId = parseInt(req.params.petId);
      const pet = await storage.getPet(petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const logs = await storage.getHydrationLogsByPet(petId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching hydration logs:", error);
      res.status(500).json({ message: "Failed to fetch hydration logs" });
    }
  });

  app.post("/api/hydration-logs", isAuthenticated, async (req: any, res) => {
    try {
      const pet = await storage.getPet(req.body.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const parsed = insertHydrationLogSchema.parse(req.body);
      const log = await storage.createHydrationLog(parsed);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating hydration log:", error);
      res.status(400).json({ message: "Invalid hydration log data" });
    }
  });

  app.delete("/api/hydration-logs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getHydrationLog(id);
      if (!existing) {
        return res.status(404).json({ message: "Hydration log not found" });
      }
      const pet = await storage.getPet(existing.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteHydrationLog(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting hydration log:", error);
      res.status(500).json({ message: "Failed to delete hydration log" });
    }
  });

  app.get("/api/pets/:petId/behavior-logs", isAuthenticated, async (req: any, res) => {
    try {
      const petId = parseInt(req.params.petId);
      const pet = await storage.getPet(petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const logs = await storage.getBehaviorLogsByPet(petId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching behavior logs:", error);
      res.status(500).json({ message: "Failed to fetch behavior logs" });
    }
  });

  app.post("/api/behavior-logs", isAuthenticated, async (req: any, res) => {
    try {
      const pet = await storage.getPet(req.body.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const parsed = insertBehaviorLogSchema.parse(req.body);
      const log = await storage.createBehaviorLog(parsed);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating behavior log:", error);
      res.status(400).json({ message: "Invalid behavior log data" });
    }
  });

  app.patch("/api/behavior-logs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getBehaviorLog(id);
      if (!existing) {
        return res.status(404).json({ message: "Behavior log not found" });
      }
      const pet = await storage.getPet(existing.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { petId, id: bodyId, ...safeData } = req.body;
      const log = await storage.updateBehaviorLog(id, safeData);
      res.json(log);
    } catch (error) {
      console.error("Error updating behavior log:", error);
      res.status(500).json({ message: "Failed to update behavior log" });
    }
  });

  app.delete("/api/behavior-logs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getBehaviorLog(id);
      if (!existing) {
        return res.status(404).json({ message: "Behavior log not found" });
      }
      const pet = await storage.getPet(existing.petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteBehaviorLog(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting behavior log:", error);
      res.status(500).json({ message: "Failed to delete behavior log" });
    }
  });

  app.post("/api/ai-chat", isAuthenticated, async (req: any, res) => {
    try {
      const { message, petContext, history } = req.body;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const chatHistory = (history || []).slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a friendly and knowledgeable pet care assistant for the Furry Assistant 1 app. You provide helpful, accurate, and safe advice about pet health, nutrition, behavior, training, and general care.

${petContext || ""}

Guidelines:
- Be warm and supportive in your responses
- Provide practical, actionable advice
- Always recommend consulting a veterinarian for serious health concerns
- Keep responses concise but thorough
- Use bullet points for lists when helpful
- Never recommend medications without veterinary consultation`,
          },
          ...chatHistory,
          {
            role: "user",
            content: message,
          },
        ],
        stream: true,
        max_completion_tokens: 1024,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in AI chat:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to process request" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Failed to process AI chat request" });
      }
    }
  });

  app.post("/api/behavior-suggestions", isAuthenticated, async (req: any, res) => {
    try {
      const { petId, behaviorType, description, triggers } = req.body;
      const pet = await storage.getPet(petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional pet behaviorist. Provide helpful, safe, and practical advice for pet behavior issues. Be concise but thorough.`,
          },
          {
            role: "user",
            content: `My ${pet.species} named ${pet.name} (breed: ${pet.breed || "unknown"}) is exhibiting the following behavior: ${behaviorType}. 
            
Description: ${description || "No additional description provided"}
Triggers: ${triggers || "No specific triggers identified"}

Please provide:
1. Possible causes for this behavior
2. Recommended training techniques
3. When to seek professional help
4. General tips for managing this behavior`,
          },
        ],
        max_completion_tokens: 1024,
      });

      const suggestion = response.choices[0]?.message?.content || "Unable to generate suggestion";
      res.json({ suggestion });
    } catch (error) {
      console.error("Error generating behavior suggestion:", error);
      res.status(500).json({ message: "Failed to generate behavior suggestion" });
    }
  });

  app.get("/api/expenses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const expenses = await storage.getExpensesByUser(userId);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertExpenseSchema.parse({ ...req.body, userId });
      const expense = await storage.createExpense(parsed);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(400).json({ message: "Invalid expense data" });
    }
  });

  app.delete("/api/expenses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getExpense(id);
      if (!existing || existing.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Expense not found" });
      }
      await storage.deleteExpense(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Reminders routes
  app.get("/api/reminders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reminders = await storage.getRemindersByUser(userId);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.get("/api/reminders/upcoming", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reminders = await storage.getUpcomingRemindersByUser(userId);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching upcoming reminders:", error);
      res.status(500).json({ message: "Failed to fetch upcoming reminders" });
    }
  });

  app.get("/api/reminders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const reminder = await storage.getReminder(id);
      if (!reminder || reminder.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      res.json(reminder);
    } catch (error) {
      console.error("Error fetching reminder:", error);
      res.status(500).json({ message: "Failed to fetch reminder" });
    }
  });

  app.post("/api/reminders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertReminderSchema.parse({ ...req.body, userId });
      const reminder = await storage.createReminder(parsed);
      res.status(201).json(reminder);
    } catch (error) {
      console.error("Error creating reminder:", error);
      res.status(400).json({ message: "Invalid reminder data" });
    }
  });

  app.patch("/api/reminders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getReminder(id);
      if (!existing || existing.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      const allowedFields = ["title", "description", "reminderType", "reminderDate", "reminderTime", "petId", "isRecurring", "recurringInterval", "isCompleted"];
      const safeData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          safeData[field] = req.body[field];
        }
      }
      const reminder = await storage.updateReminder(id, safeData);
      res.json(reminder);
    } catch (error) {
      console.error("Error updating reminder:", error);
      res.status(500).json({ message: "Failed to update reminder" });
    }
  });

  app.patch("/api/reminders/:id/complete", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getReminder(id);
      if (!existing || existing.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      const reminder = await storage.markReminderCompleted(id);
      res.json(reminder);
    } catch (error) {
      console.error("Error completing reminder:", error);
      res.status(500).json({ message: "Failed to complete reminder" });
    }
  });

  app.delete("/api/reminders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getReminder(id);
      if (!existing || existing.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      await storage.deleteReminder(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting reminder:", error);
      res.status(500).json({ message: "Failed to delete reminder" });
    }
  });

  app.get("/api/emergency-contacts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contacts = await storage.getEmergencyContactsByUser(userId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching emergency contacts:", error);
      res.status(500).json({ message: "Failed to fetch emergency contacts" });
    }
  });

  app.post("/api/emergency-contacts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertEmergencyContactSchema.parse({ ...req.body, userId });
      const contact = await storage.createEmergencyContact(parsed);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating emergency contact:", error);
      res.status(400).json({ message: "Invalid emergency contact data" });
    }
  });

  app.patch("/api/emergency-contacts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getEmergencyContact(id);
      if (!existing || existing.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Emergency contact not found" });
      }
      const { userId, id: bodyId, ...safeData } = req.body;
      const contact = await storage.updateEmergencyContact(id, safeData);
      res.json(contact);
    } catch (error) {
      console.error("Error updating emergency contact:", error);
      res.status(500).json({ message: "Failed to update emergency contact" });
    }
  });

  app.delete("/api/emergency-contacts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getEmergencyContact(id);
      if (!existing || existing.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Emergency contact not found" });
      }
      await storage.deleteEmergencyContact(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting emergency contact:", error);
      res.status(500).json({ message: "Failed to delete emergency contact" });
    }
  });

  app.get("/api/training-resources", async (req, res) => {
    try {
      const { category } = req.query;
      const resources = category
        ? await storage.getTrainingResourcesByCategory(category as string)
        : await storage.getTrainingResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching training resources:", error);
      res.status(500).json({ message: "Failed to fetch training resources" });
    }
  });

  app.get("/api/first-aid-guides", async (req, res) => {
    try {
      const { category } = req.query;
      const guides = category
        ? await storage.getFirstAidGuidesByCategory(category as string)
        : await storage.getFirstAidGuides();
      res.json(guides);
    } catch (error) {
      console.error("Error fetching first aid guides:", error);
      res.status(500).json({ message: "Failed to fetch first aid guides" });
    }
  });

  app.post("/api/meal-plans/generate", isAuthenticated, async (req: any, res) => {
    try {
      const { petId } = req.body;
      const pet = await storage.getPet(petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional pet nutritionist. Create detailed, safe, and balanced meal plans for pets. Format your response as a structured meal plan with clear sections.`,
          },
          {
            role: "user",
            content: `Create a weekly meal plan for my ${pet.species} named ${pet.name}.
            
Details:
- Breed: ${pet.breed || "Unknown"}
- Age: ${pet.dateOfBirth ? `Born ${pet.dateOfBirth}` : "Unknown age"}
- Weight: ${pet.weight ? `${pet.weight} kg` : "Unknown weight"}
- Gender: ${pet.gender || "Unknown"}
- Notes: ${pet.notes || "None"}

Please provide:
1. Daily caloric needs estimate
2. Recommended feeding schedule
3. Suggested foods and portions
4. Foods to avoid
5. Hydration recommendations
6. Any supplements to consider`,
          },
        ],
        max_completion_tokens: 2048,
      });

      const planContent = response.choices[0]?.message?.content || "Unable to generate meal plan";
      const mealPlan = await storage.createMealPlan({ petId, planContent });
      res.status(201).json(mealPlan);
    } catch (error) {
      console.error("Error generating meal plan:", error);
      res.status(500).json({ message: "Failed to generate meal plan" });
    }
  });

  app.get("/api/pets/:petId/meal-plans", isAuthenticated, async (req: any, res) => {
    try {
      const petId = parseInt(req.params.petId);
      const pet = await storage.getPet(petId);
      if (!pet || pet.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const plans = await storage.getMealPlansByPet(petId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching meal plans:", error);
      res.status(500).json({ message: "Failed to fetch meal plans" });
    }
  });

  app.post("/api/feature-usage", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { featureName } = req.body;
      const usage = await storage.trackFeatureUsage({ userId, featureName });
      res.json(usage);
    } catch (error) {
      console.error("Error tracking feature usage:", error);
      res.status(500).json({ message: "Failed to track feature usage" });
    }
  });

  // Note: GET /api/admin/users is defined later with isAdmin middleware and a sanitized
  // response shape. The duplicate here was returning raw user rows (including passwordHash)
  // and has been removed. See the sanitized handler further down in this file.

  app.get("/api/admin/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const analytics = await storage.getFeatureAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Google Places API endpoint for real local services
  app.get("/api/places/nearby", async (req, res) => {
    try {
      const { lat, lng, type } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Google Places API key not configured" });
      }
      
      // Map our category types to Google Places types
      const typeMapping: Record<string, string[]> = {
        veterinary: ["veterinary_care"],
        groomer: ["pet_store"], // Google doesn't have a specific groomer type
        pet_store: ["pet_store"],
        boarding: ["lodging"], // Use lodging as closest match
        all: ["veterinary_care", "pet_store"],
      };
      
      const includedTypes = typeMapping[type as string] || typeMapping.all;
      
      const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.internationalPhoneNumber,places.websiteUri,places.businessStatus",
        },
        body: JSON.stringify({
          locationRestriction: {
            circle: {
              center: {
                latitude: parseFloat(lat as string),
                longitude: parseFloat(lng as string),
              },
              radius: 10000, // 10km radius
            },
          },
          includedTypes,
          maxResultCount: 20,
          rankPreference: "DISTANCE",
          languageCode: "en",
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error("Google Places API error:", error);
        return res.status(500).json({ message: "Failed to fetch places" });
      }
      
      const data = await response.json();
      
      // Transform Google Places response to match our app's format
      const services = (data.places || []).map((place: any, index: number) => {
        // Determine category based on place types
        let category = "pet_store";
        if (place.types?.includes("veterinary_care")) {
          category = "veterinary";
        }
        
        return {
          id: `google-${index}`,
          googlePlaceId: place.id,
          name: place.displayName?.text || "Unknown",
          category,
          address: place.formattedAddress || "",
          phone: place.internationalPhoneNumber || null,
          website: place.websiteUri || null,
          lat: place.location?.latitude || null,
          lng: place.location?.longitude || null,
          rating: place.rating || null,
          reviewCount: place.userRatingCount || 0,
          isOpen: place.businessStatus === "OPERATIONAL",
        };
      });
      
      res.json(services);
    } catch (error) {
      console.error("Error fetching nearby places:", error);
      res.status(500).json({ message: "Failed to fetch nearby places" });
    }
  });

  app.get("/api/local-services", async (req, res) => {
    try {
      const { category } = req.query;
      const services = category && category !== "all"
        ? await storage.getLocalServicesByCategory(category as string)
        : await storage.getLocalServices();
      
      const servicesWithRatings = await Promise.all(
        services.map(async (service) => {
          const avgRating = await storage.getServiceAverageRating(service.id);
          const reviews = await storage.getServiceReviews(service.id);
          return { ...service, rating: avgRating, reviewCount: reviews.length };
        })
      );
      
      res.json(servicesWithRatings);
    } catch (error) {
      console.error("Error fetching local services:", error);
      res.status(500).json({ message: "Failed to fetch local services" });
    }
  });

  app.get("/api/local-services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await storage.getLocalService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      const avgRating = await storage.getServiceAverageRating(id);
      const reviews = await storage.getServiceReviews(id);
      res.json({ ...service, rating: avgRating, reviewCount: reviews.length });
    } catch (error) {
      console.error("Error fetching local service:", error);
      res.status(500).json({ message: "Failed to fetch local service" });
    }
  });

  app.post("/api/local-services", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Only admins can add services" });
      }
      const parsed = insertLocalServiceSchema.parse(req.body);
      const service = await storage.createLocalService(parsed);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating local service:", error);
      res.status(400).json({ message: "Invalid service data" });
    }
  });

  app.get("/api/local-services/:serviceId/reviews", async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const service = await storage.getLocalService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      const reviews = await storage.getServiceReviews(serviceId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching service reviews:", error);
      res.status(500).json({ message: "Failed to fetch service reviews" });
    }
  });

  app.post("/api/service-reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { serviceId, rating, comment } = req.body;
      
      const service = await storage.getLocalService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      
      const parsed = insertServiceReviewSchema.parse({ serviceId, userId, rating, comment });
      const review = await storage.createServiceReview(parsed);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating service review:", error);
      res.status(400).json({ message: "Invalid review data" });
    }
  });

  app.delete("/api/service-reviews/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const review = await storage.getServiceReview(id);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      if (review.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteServiceReview(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service review:", error);
      res.status(500).json({ message: "Failed to delete service review" });
    }
  });

  // Forum posts
  app.get("/api/forum/posts", async (req, res) => {
    try {
      const { category } = req.query;
      const posts = category
        ? await storage.getForumPostsByCategory(category as string)
        : await storage.getForumPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching forum posts:", error);
      res.status(500).json({ message: "Failed to fetch forum posts" });
    }
  });

  app.get("/api/forum/posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getForumPost(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching forum post:", error);
      res.status(500).json({ message: "Failed to fetch forum post" });
    }
  });

  app.post("/api/forum/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertForumPostSchema.parse({ ...req.body, userId });
      const post = await storage.createForumPost(parsed);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating forum post:", error);
      res.status(400).json({ message: "Invalid post data" });
    }
  });

  app.delete("/api/forum/posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getForumPost(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      if (post.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteForumPost(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting forum post:", error);
      res.status(500).json({ message: "Failed to delete forum post" });
    }
  });

  // Forum comments
  app.get("/api/forum/posts/:postId/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const post = await storage.getForumPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      const comments = await storage.getForumComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/forum/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId, content } = req.body;
      const post = await storage.getForumPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      const parsed = insertForumCommentSchema.parse({ postId, userId, content });
      const comment = await storage.createForumComment(parsed);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  app.delete("/api/forum/comments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const comment = await storage.getForumComment(id);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      if (comment.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteForumComment(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Subscription routes
  app.get("/api/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getSubscriptionByUser(userId);
      res.json(subscription || null);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Get Stripe publishable key
  app.get("/api/stripe/config", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error fetching Stripe config:", error);
      res.status(500).json({ message: "Failed to fetch Stripe config" });
    }
  });

  // Get available subscription prices from Stripe
  app.get("/api/stripe/prices", async (req, res) => {
    try {
      const result = await db.execute(
        sql`SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.metadata as price_metadata
        FROM stripe.products p
        JOIN stripe.prices pr ON pr.product = p.id
        WHERE p.active = true AND pr.active = true
        ORDER BY pr.unit_amount`
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching prices:", error);
      res.status(500).json({ message: "Failed to fetch prices" });
    }
  });

  // Create Stripe checkout session for subscription
  app.post("/api/stripe/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const checkoutSchema = z.object({ 
        priceId: z.string().min(1, "Price ID is required").startsWith("price_") 
      });
      const { priceId } = checkoutSchema.parse(req.body);

      // Verify the price exists and is a valid recurring subscription price
      const priceResult = await db.execute(
        sql`SELECT pr.id, pr.recurring, pr.active, p.name as product_name
            FROM stripe.prices pr
            JOIN stripe.products p ON pr.product = p.id
            WHERE pr.id = ${priceId} AND pr.active = true AND p.active = true`
      );
      
      if (priceResult.rows.length === 0) {
        return res.status(400).json({ message: "Invalid or inactive price" });
      }
      
      const price = priceResult.rows[0] as any;
      if (!price.recurring) {
        return res.status(400).json({ message: "Price must be a subscription price" });
      }

      const stripe = await getUncachableStripeClient();
      
      // Get or create Stripe customer
      let customerId = user?.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user?.email || undefined,
          metadata: { userId },
        });
        customerId = customer.id;
        await storage.updateUserStripeCustomerId(userId, customer.id);
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${baseUrl}/subscription?success=true`,
        cancel_url: `${baseUrl}/subscription?cancelled=true`,
        metadata: { userId },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Create one-time Stripe Checkout for "Remove Ads" ($1.99)
  app.post("/api/stripe/checkout/remove-ads", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (user.adFree) return res.status(400).json({ message: "Ads already removed for this account" });

      const stripe = await getUncachableStripeClient();

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: { userId },
        });
        customerId = customer.id;
        await storage.updateUserStripeCustomerId(userId, customer.id);
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Remove Ads — Furry Assistant 1',
              description: 'One-time purchase. Permanently removes advertising from your account.',
            },
            unit_amount: 199,
          },
          quantity: 1,
        }],
        success_url: `${baseUrl}/subscription?adfree=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/subscription?adfree=cancelled`,
        metadata: { userId, purpose: 'remove_ads' },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating remove-ads checkout:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Verify a completed remove-ads checkout and grant ad-free status
  app.post("/api/stripe/verify-remove-ads", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schema = z.object({ sessionId: z.string().startsWith("cs_") });
      const { sessionId } = schema.parse(req.body);

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Strict checks — webhook is the primary source of truth, this is a
      // best-effort grant on the user's return so the UI updates immediately.
      if (session.mode !== 'payment') {
        return res.status(400).json({ message: "Wrong checkout mode" });
      }
      if (session.status !== 'complete' || session.payment_status !== 'paid') {
        return res.status(400).json({ message: "Payment not completed" });
      }
      if (session.metadata?.userId !== userId) {
        return res.status(403).json({ message: "Session does not belong to this user" });
      }
      if (session.metadata?.purpose !== 'remove_ads') {
        return res.status(400).json({ message: "Session is not for ad removal" });
      }
      if (session.amount_total !== 199 || session.currency !== 'usd') {
        return res.status(400).json({ message: "Unexpected payment amount" });
      }
      // Optional customer binding when we have one on file
      const userRecord = await storage.getUser(userId);
      if (userRecord?.stripeCustomerId && session.customer && session.customer !== userRecord.stripeCustomerId) {
        return res.status(403).json({ message: "Customer mismatch" });
      }

      const updated = await storage.setUserAdFree(userId, true);
      res.json({ adFree: true, user: updated });
    } catch (error: any) {
      console.error("Error verifying remove-ads:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Create Stripe customer portal session
  app.post("/api/stripe/portal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.stripeCustomerId) {
        return res.status(400).json({ message: "No billing account found. Please subscribe first." });
      }

      const stripe = await getUncachableStripeClient();
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${baseUrl}/subscription`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  app.delete("/api/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getSubscriptionByUser(userId);
      if (!subscription) {
        return res.status(404).json({ message: "No active subscription" });
      }
      await storage.cancelSubscription(subscription.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Admin routes
  app.get("/api/admin/metrics", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const metrics = await storage.getAdminMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching admin metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  app.get("/api/admin/features", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const features = await storage.getTopFeatures(limit);
      res.json(features);
    } catch (error) {
      console.error("Error fetching feature usage:", error);
      res.status(500).json({ message: "Failed to fetch feature usage" });
    }
  });

  app.get("/api/admin/user-growth", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const growth = await storage.getUserGrowth(days);
      res.json(growth);
    } catch (error) {
      console.error("Error fetching user growth:", error);
      res.status(500).json({ message: "Failed to fetch user growth" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        isPremium: u.isPremium,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt,
      })));
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/stripe/revenue", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const result = await db.execute(
        sql`SELECT 
          COUNT(*) as total_subscriptions,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
          COUNT(CASE WHEN status = 'canceled' THEN 1 END) as canceled_subscriptions
        FROM stripe.subscriptions`
      );
      res.json(result.rows[0] || { total_subscriptions: 0, active_subscriptions: 0, canceled_subscriptions: 0 });
    } catch (error) {
      console.error("Error fetching Stripe revenue:", error);
      res.json({ total_subscriptions: 0, active_subscriptions: 0, canceled_subscriptions: 0 });
    }
  });

  app.patch("/api/admin/users/:id/admin", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const userId = req.params.id;
      const { isAdmin: makeAdmin } = req.body;
      
      if (userId === currentUserId) {
        return res.status(400).json({ message: "Cannot modify your own admin status" });
      }
      
      if (typeof makeAdmin !== "boolean") {
        return res.status(400).json({ message: "isAdmin must be a boolean" });
      }
      
      const updated = await storage.setUserAdmin(userId, makeAdmin);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: updated.id, isAdmin: updated.isAdmin });
    } catch (error) {
      console.error("Error updating user admin status:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Admin endpoint to toggle premium status for a user
  app.patch("/api/admin/users/:id/premium", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const { isPremium } = req.body;
      
      if (typeof isPremium !== "boolean") {
        return res.status(400).json({ message: "isPremium must be a boolean" });
      }
      
      const updated = await storage.setUserPremium(userId, isPremium);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: updated.id, isPremium: updated.isPremium });
    } catch (error) {
      console.error("Error updating user premium status:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  return httpServer;
}
