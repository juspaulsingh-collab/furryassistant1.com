import { eq, and, desc, sql, count, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  pets,
  healthRecords,
  medications,
  activities,
  activityGoals,
  nutritionLogs,
  hydrationLogs,
  behaviorLogs,
  trainingResources,
  expenses,
  emergencyContacts,
  firstAidGuides,
  featureUsage,
  mealPlans,
  reminders,
  localServices,
  serviceReviews,
  forumPosts,
  forumComments,
  subscriptions,
  type User,
  type UpsertUser,
  type Pet,
  type InsertPet,
  type HealthRecord,
  type InsertHealthRecord,
  type Medication,
  type InsertMedication,
  type Activity,
  type InsertActivity,
  type ActivityGoal,
  type InsertActivityGoal,
  type NutritionLog,
  type InsertNutritionLog,
  type HydrationLog,
  type InsertHydrationLog,
  type BehaviorLog,
  type InsertBehaviorLog,
  type TrainingResource,
  type Expense,
  type InsertExpense,
  type EmergencyContact,
  type InsertEmergencyContact,
  type FirstAidGuide,
  type FeatureUsage,
  type InsertFeatureUsage,
  type MealPlan,
  type InsertMealPlan,
  type Reminder,
  type InsertReminder,
  type LocalService,
  type InsertLocalService,
  type ServiceReview,
  type InsertServiceReview,
  type ForumPost,
  type InsertForumPost,
  type ForumComment,
  type InsertForumComment,
  type Subscription,
  type InsertSubscription,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  updateUserStripeCustomerId(id: string, stripeCustomerId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;

  getPetsByUser(userId: string): Promise<Pet[]>;
  getPet(id: number): Promise<Pet | undefined>;
  createPet(pet: InsertPet): Promise<Pet>;
  updatePet(id: number, pet: Partial<InsertPet>): Promise<Pet | undefined>;
  deletePet(id: number): Promise<void>;

  getHealthRecordsByPet(petId: number): Promise<HealthRecord[]>;
  getHealthRecord(id: number): Promise<HealthRecord | undefined>;
  createHealthRecord(record: InsertHealthRecord): Promise<HealthRecord>;
  updateHealthRecord(id: number, record: Partial<InsertHealthRecord>): Promise<HealthRecord | undefined>;
  deleteHealthRecord(id: number): Promise<void>;

  getMedicationsByPet(petId: number): Promise<Medication[]>;
  getMedication(id: number): Promise<Medication | undefined>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  updateMedication(id: number, medication: Partial<InsertMedication>): Promise<Medication | undefined>;
  deleteMedication(id: number): Promise<void>;

  getActivitiesByPet(petId: number): Promise<Activity[]>;
  getActivity(id: number): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<void>;

  getActivityGoalsByPet(petId: number): Promise<ActivityGoal[]>;
  createActivityGoal(goal: InsertActivityGoal): Promise<ActivityGoal>;
  deleteActivityGoal(id: number): Promise<void>;

  getNutritionLogsByPet(petId: number): Promise<NutritionLog[]>;
  getNutritionLogsByUser(userId: string): Promise<NutritionLog[]>;
  getNutritionLog(id: number): Promise<NutritionLog | undefined>;
  createNutritionLog(log: InsertNutritionLog): Promise<NutritionLog>;
  updateNutritionLog(id: number, log: Partial<InsertNutritionLog>): Promise<NutritionLog | undefined>;
  deleteNutritionLog(id: number): Promise<void>;

  getHydrationLogsByPet(petId: number): Promise<HydrationLog[]>;
  getHydrationLog(id: number): Promise<HydrationLog | undefined>;
  createHydrationLog(log: InsertHydrationLog): Promise<HydrationLog>;
  deleteHydrationLog(id: number): Promise<void>;

  getBehaviorLogsByPet(petId: number): Promise<BehaviorLog[]>;
  getBehaviorLog(id: number): Promise<BehaviorLog | undefined>;
  createBehaviorLog(log: InsertBehaviorLog): Promise<BehaviorLog>;
  updateBehaviorLog(id: number, log: Partial<InsertBehaviorLog>): Promise<BehaviorLog | undefined>;
  deleteBehaviorLog(id: number): Promise<void>;

  getTrainingResources(): Promise<TrainingResource[]>;
  getTrainingResourcesByCategory(category: string): Promise<TrainingResource[]>;

  getExpensesByUser(userId: string): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;

  getEmergencyContactsByUser(userId: string): Promise<EmergencyContact[]>;
  getEmergencyContact(id: number): Promise<EmergencyContact | undefined>;
  createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact>;
  updateEmergencyContact(id: number, contact: Partial<InsertEmergencyContact>): Promise<EmergencyContact | undefined>;
  deleteEmergencyContact(id: number): Promise<void>;

  getFirstAidGuides(): Promise<FirstAidGuide[]>;
  getFirstAidGuidesByCategory(category: string): Promise<FirstAidGuide[]>;

  trackFeatureUsage(usage: InsertFeatureUsage): Promise<FeatureUsage>;
  getFeatureUsageByUser(userId: string): Promise<FeatureUsage[]>;
  getFeatureAnalytics(): Promise<{ featureName: string; totalUsage: number }[]>;

  getMealPlansByPet(petId: number): Promise<MealPlan[]>;
  createMealPlan(plan: InsertMealPlan): Promise<MealPlan>;

  getRemindersByUser(userId: string): Promise<Reminder[]>;
  getUpcomingRemindersByUser(userId: string): Promise<Reminder[]>;
  getReminder(id: number): Promise<Reminder | undefined>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: number, reminder: Partial<InsertReminder>): Promise<Reminder | undefined>;
  deleteReminder(id: number): Promise<void>;
  markReminderCompleted(id: number): Promise<Reminder | undefined>;

  getLocalServices(): Promise<LocalService[]>;
  getLocalServicesByCategory(category: string): Promise<LocalService[]>;
  getLocalService(id: number): Promise<LocalService | undefined>;
  createLocalService(service: InsertLocalService): Promise<LocalService>;
  getServiceAverageRating(serviceId: number): Promise<number>;

  getServiceReviews(serviceId: number): Promise<ServiceReview[]>;
  getServiceReview(id: number): Promise<ServiceReview | undefined>;
  createServiceReview(review: InsertServiceReview): Promise<ServiceReview>;
  deleteServiceReview(id: number): Promise<void>;

  getForumPosts(): Promise<ForumPost[]>;
  getForumPostsByCategory(category: string): Promise<ForumPost[]>;
  getForumPost(id: number): Promise<ForumPost | undefined>;
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  deleteForumPost(id: number): Promise<void>;

  getForumComments(postId: number): Promise<ForumComment[]>;
  getForumComment(id: number): Promise<ForumComment | undefined>;
  createForumComment(comment: InsertForumComment): Promise<ForumComment>;
  deleteForumComment(id: number): Promise<void>;

  getSubscriptionByUser(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  cancelSubscription(id: number): Promise<Subscription | undefined>;

  // Admin analytics
  getAdminMetrics(): Promise<{
    totalUsers: number;
    premiumUsers: number;
    activeUsersToday: number;
    activeUsersThisWeek: number;
    activeUsersThisMonth: number;
    newUsersThisWeek: number;
    totalPets: number;
  }>;
  getTopFeatures(limit?: number): Promise<{ featureName: string; totalUsage: number; uniqueUsers: number }[]>;
  getUserGrowth(days?: number): Promise<{ date: string; count: number }[]>;
  setUserAdmin(userId: string, isAdmin: boolean): Promise<User | undefined>;
  setUserPremium(userId: string, isPremium: boolean): Promise<User | undefined>;
  setUserAdFree(userId: string, adFree: boolean): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserStripeCustomerId(id: string, stripeCustomerId: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ stripeCustomerId, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    // All related data cascades automatically due to onDelete: "cascade" in schema
    // Delete the user - all pets, health records, medications, activities, 
    // nutrition logs, expenses, reminders, etc. will be deleted via cascade
    await db.delete(users).where(eq(users.id, id));
  }

  async getPetsByUser(userId: string): Promise<Pet[]> {
    return db.select().from(pets).where(eq(pets.userId, userId)).orderBy(desc(pets.createdAt));
  }

  async getPet(id: number): Promise<Pet | undefined> {
    const [pet] = await db.select().from(pets).where(eq(pets.id, id));
    return pet;
  }

  async createPet(pet: InsertPet): Promise<Pet> {
    const [newPet] = await db.insert(pets).values(pet).returning();
    return newPet;
  }

  async updatePet(id: number, pet: Partial<InsertPet>): Promise<Pet | undefined> {
    const [updated] = await db
      .update(pets)
      .set({ ...pet, updatedAt: new Date() })
      .where(eq(pets.id, id))
      .returning();
    return updated;
  }

  async deletePet(id: number): Promise<void> {
    await db.delete(pets).where(eq(pets.id, id));
  }

  async getHealthRecordsByPet(petId: number): Promise<HealthRecord[]> {
    return db.select().from(healthRecords).where(eq(healthRecords.petId, petId)).orderBy(desc(healthRecords.date));
  }

  async getHealthRecord(id: number): Promise<HealthRecord | undefined> {
    const [record] = await db.select().from(healthRecords).where(eq(healthRecords.id, id));
    return record;
  }

  async createHealthRecord(record: InsertHealthRecord): Promise<HealthRecord> {
    const [newRecord] = await db.insert(healthRecords).values(record).returning();
    return newRecord;
  }

  async updateHealthRecord(id: number, record: Partial<InsertHealthRecord>): Promise<HealthRecord | undefined> {
    const [updated] = await db
      .update(healthRecords)
      .set({ ...record, updatedAt: new Date() })
      .where(eq(healthRecords.id, id))
      .returning();
    return updated;
  }

  async deleteHealthRecord(id: number): Promise<void> {
    await db.delete(healthRecords).where(eq(healthRecords.id, id));
  }

  async getMedicationsByPet(petId: number): Promise<Medication[]> {
    return db.select().from(medications).where(eq(medications.petId, petId)).orderBy(desc(medications.createdAt));
  }

  async getMedication(id: number): Promise<Medication | undefined> {
    const [med] = await db.select().from(medications).where(eq(medications.id, id));
    return med;
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    const [newMed] = await db.insert(medications).values(medication).returning();
    return newMed;
  }

  async updateMedication(id: number, medication: Partial<InsertMedication>): Promise<Medication | undefined> {
    const [updated] = await db
      .update(medications)
      .set({ ...medication, updatedAt: new Date() })
      .where(eq(medications.id, id))
      .returning();
    return updated;
  }

  async deleteMedication(id: number): Promise<void> {
    await db.delete(medications).where(eq(medications.id, id));
  }

  async getActivitiesByPet(petId: number): Promise<Activity[]> {
    return db.select().from(activities).where(eq(activities.petId, petId)).orderBy(desc(activities.date));
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  async updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity | undefined> {
    const [updated] = await db.update(activities).set(activity).where(eq(activities.id, id)).returning();
    return updated;
  }

  async deleteActivity(id: number): Promise<void> {
    await db.delete(activities).where(eq(activities.id, id));
  }

  async getActivityGoalsByPet(petId: number): Promise<ActivityGoal[]> {
    return db.select().from(activityGoals).where(eq(activityGoals.petId, petId));
  }

  async createActivityGoal(goal: InsertActivityGoal): Promise<ActivityGoal> {
    const [newGoal] = await db.insert(activityGoals).values(goal).returning();
    return newGoal;
  }

  async deleteActivityGoal(id: number): Promise<void> {
    await db.delete(activityGoals).where(eq(activityGoals.id, id));
  }

  async getNutritionLogsByPet(petId: number): Promise<NutritionLog[]> {
    return db.select().from(nutritionLogs).where(eq(nutritionLogs.petId, petId)).orderBy(desc(nutritionLogs.date));
  }

  async getNutritionLogsByUser(userId: string): Promise<NutritionLog[]> {
    const userPets = await db.select().from(pets).where(eq(pets.userId, userId));
    const petIds = userPets.map(p => p.id);
    if (petIds.length === 0) return [];
    return db.select().from(nutritionLogs).where(inArray(nutritionLogs.petId, petIds)).orderBy(desc(nutritionLogs.date));
  }

  async getNutritionLog(id: number): Promise<NutritionLog | undefined> {
    const [log] = await db.select().from(nutritionLogs).where(eq(nutritionLogs.id, id));
    return log;
  }

  async createNutritionLog(log: InsertNutritionLog): Promise<NutritionLog> {
    const [newLog] = await db.insert(nutritionLogs).values(log).returning();
    return newLog;
  }

  async updateNutritionLog(id: number, log: Partial<InsertNutritionLog>): Promise<NutritionLog | undefined> {
    const [updated] = await db.update(nutritionLogs).set(log).where(eq(nutritionLogs.id, id)).returning();
    return updated;
  }

  async deleteNutritionLog(id: number): Promise<void> {
    await db.delete(nutritionLogs).where(eq(nutritionLogs.id, id));
  }

  async getHydrationLogsByPet(petId: number): Promise<HydrationLog[]> {
    return db.select().from(hydrationLogs).where(eq(hydrationLogs.petId, petId)).orderBy(desc(hydrationLogs.date));
  }

  async getHydrationLog(id: number): Promise<HydrationLog | undefined> {
    const [log] = await db.select().from(hydrationLogs).where(eq(hydrationLogs.id, id));
    return log;
  }

  async createHydrationLog(log: InsertHydrationLog): Promise<HydrationLog> {
    const [newLog] = await db.insert(hydrationLogs).values(log).returning();
    return newLog;
  }

  async deleteHydrationLog(id: number): Promise<void> {
    await db.delete(hydrationLogs).where(eq(hydrationLogs.id, id));
  }

  async getBehaviorLogsByPet(petId: number): Promise<BehaviorLog[]> {
    return db.select().from(behaviorLogs).where(eq(behaviorLogs.petId, petId)).orderBy(desc(behaviorLogs.date));
  }

  async getBehaviorLog(id: number): Promise<BehaviorLog | undefined> {
    const [log] = await db.select().from(behaviorLogs).where(eq(behaviorLogs.id, id));
    return log;
  }

  async createBehaviorLog(log: InsertBehaviorLog): Promise<BehaviorLog> {
    const [newLog] = await db.insert(behaviorLogs).values(log).returning();
    return newLog;
  }

  async updateBehaviorLog(id: number, log: Partial<InsertBehaviorLog>): Promise<BehaviorLog | undefined> {
    const [updated] = await db.update(behaviorLogs).set(log).where(eq(behaviorLogs.id, id)).returning();
    return updated;
  }

  async deleteBehaviorLog(id: number): Promise<void> {
    await db.delete(behaviorLogs).where(eq(behaviorLogs.id, id));
  }

  async getTrainingResources(): Promise<TrainingResource[]> {
    return db.select().from(trainingResources).orderBy(trainingResources.category);
  }

  async getTrainingResourcesByCategory(category: string): Promise<TrainingResource[]> {
    return db.select().from(trainingResources).where(eq(trainingResources.category, category));
  }

  async getExpensesByUser(userId: string): Promise<Expense[]> {
    return db.select().from(expenses).where(eq(expenses.userId, userId)).orderBy(desc(expenses.date));
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async getEmergencyContactsByUser(userId: string): Promise<EmergencyContact[]> {
    return db.select().from(emergencyContacts).where(eq(emergencyContacts.userId, userId)).orderBy(desc(emergencyContacts.isPrimary));
  }

  async getEmergencyContact(id: number): Promise<EmergencyContact | undefined> {
    const [contact] = await db.select().from(emergencyContacts).where(eq(emergencyContacts.id, id));
    return contact;
  }

  async createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact> {
    const [newContact] = await db.insert(emergencyContacts).values(contact).returning();
    return newContact;
  }

  async updateEmergencyContact(id: number, contact: Partial<InsertEmergencyContact>): Promise<EmergencyContact | undefined> {
    const [updated] = await db.update(emergencyContacts).set(contact).where(eq(emergencyContacts.id, id)).returning();
    return updated;
  }

  async deleteEmergencyContact(id: number): Promise<void> {
    await db.delete(emergencyContacts).where(eq(emergencyContacts.id, id));
  }

  async getFirstAidGuides(): Promise<FirstAidGuide[]> {
    return db.select().from(firstAidGuides).orderBy(firstAidGuides.category);
  }

  async getFirstAidGuidesByCategory(category: string): Promise<FirstAidGuide[]> {
    return db.select().from(firstAidGuides).where(eq(firstAidGuides.category, category));
  }

  async trackFeatureUsage(usage: InsertFeatureUsage): Promise<FeatureUsage> {
    const existing = await db
      .select()
      .from(featureUsage)
      .where(
        and(
          eq(featureUsage.userId, usage.userId),
          eq(featureUsage.featureName, usage.featureName)
        )
      );

    if (existing.length > 0) {
      const [updated] = await db
        .update(featureUsage)
        .set({
          usageCount: sql`${featureUsage.usageCount} + 1`,
          lastUsedAt: new Date(),
        })
        .where(eq(featureUsage.id, existing[0].id))
        .returning();
      return updated;
    }

    const [newUsage] = await db.insert(featureUsage).values(usage).returning();
    return newUsage;
  }

  async getFeatureUsageByUser(userId: string): Promise<FeatureUsage[]> {
    return db.select().from(featureUsage).where(eq(featureUsage.userId, userId));
  }

  async getFeatureAnalytics(): Promise<{ featureName: string; totalUsage: number }[]> {
    const results = await db
      .select({
        featureName: featureUsage.featureName,
        totalUsage: sql<number>`sum(${featureUsage.usageCount})::int`,
      })
      .from(featureUsage)
      .groupBy(featureUsage.featureName)
      .orderBy(desc(sql`sum(${featureUsage.usageCount})`));
    return results;
  }

  async getMealPlansByPet(petId: number): Promise<MealPlan[]> {
    return db.select().from(mealPlans).where(eq(mealPlans.petId, petId)).orderBy(desc(mealPlans.generatedAt));
  }

  async createMealPlan(plan: InsertMealPlan): Promise<MealPlan> {
    const [newPlan] = await db.insert(mealPlans).values(plan).returning();
    return newPlan;
  }

  async getLocalServices(): Promise<LocalService[]> {
    return db.select().from(localServices).orderBy(localServices.name);
  }

  async getLocalServicesByCategory(category: string): Promise<LocalService[]> {
    return db.select().from(localServices).where(eq(localServices.category, category)).orderBy(localServices.name);
  }

  async getLocalService(id: number): Promise<LocalService | undefined> {
    const [service] = await db.select().from(localServices).where(eq(localServices.id, id));
    return service;
  }

  async createLocalService(service: InsertLocalService): Promise<LocalService> {
    const [newService] = await db.insert(localServices).values(service).returning();
    return newService;
  }

  async getServiceAverageRating(serviceId: number): Promise<number> {
    const result = await db
      .select({ avgRating: sql<number>`COALESCE(AVG(${serviceReviews.rating}), 0)` })
      .from(serviceReviews)
      .where(eq(serviceReviews.serviceId, serviceId));
    return Number(result[0]?.avgRating || 0);
  }

  async getServiceReviews(serviceId: number): Promise<ServiceReview[]> {
    return db.select().from(serviceReviews).where(eq(serviceReviews.serviceId, serviceId)).orderBy(desc(serviceReviews.createdAt));
  }

  async getServiceReview(id: number): Promise<ServiceReview | undefined> {
    const [review] = await db.select().from(serviceReviews).where(eq(serviceReviews.id, id));
    return review;
  }

  async createServiceReview(review: InsertServiceReview): Promise<ServiceReview> {
    const [newReview] = await db.insert(serviceReviews).values(review).returning();
    return newReview;
  }

  async deleteServiceReview(id: number): Promise<void> {
    await db.delete(serviceReviews).where(eq(serviceReviews.id, id));
  }

  async getForumPosts(): Promise<ForumPost[]> {
    return db.select().from(forumPosts).orderBy(desc(forumPosts.createdAt));
  }

  async getForumPostsByCategory(category: string): Promise<ForumPost[]> {
    return db.select().from(forumPosts).where(eq(forumPosts.category, category)).orderBy(desc(forumPosts.createdAt));
  }

  async getForumPost(id: number): Promise<ForumPost | undefined> {
    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, id));
    return post;
  }

  async createForumPost(post: InsertForumPost): Promise<ForumPost> {
    const [newPost] = await db.insert(forumPosts).values(post).returning();
    return newPost;
  }

  async deleteForumPost(id: number): Promise<void> {
    await db.delete(forumPosts).where(eq(forumPosts.id, id));
  }

  async getForumComments(postId: number): Promise<ForumComment[]> {
    return db.select().from(forumComments).where(eq(forumComments.postId, postId)).orderBy(forumComments.createdAt);
  }

  async getForumComment(id: number): Promise<ForumComment | undefined> {
    const [comment] = await db.select().from(forumComments).where(eq(forumComments.id, id));
    return comment;
  }

  async createForumComment(comment: InsertForumComment): Promise<ForumComment> {
    const [newComment] = await db.insert(forumComments).values(comment).returning();
    return newComment;
  }

  async deleteForumComment(id: number): Promise<void> {
    await db.delete(forumComments).where(eq(forumComments.id, id));
  }

  async getSubscriptionByUser(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
      .orderBy(desc(subscriptions.createdAt));
    return subscription;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    await db.update(users).set({ isPremium: true }).where(eq(users.id, subscription.userId));
    return newSubscription;
  }

  async updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updated] = await db.update(subscriptions)
      .set({ ...subscription, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  async cancelSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    if (!subscription) return undefined;
    
    const [updated] = await db.update(subscriptions)
      .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    
    await db.update(users).set({ isPremium: false }).where(eq(users.id, subscription.userId));
    return updated;
  }

  async getRemindersByUser(userId: string): Promise<Reminder[]> {
    return db.select().from(reminders).where(eq(reminders.userId, userId)).orderBy(reminders.reminderDate);
  }

  async getUpcomingRemindersByUser(userId: string): Promise<Reminder[]> {
    const today = new Date().toISOString().split('T')[0];
    return db.select().from(reminders)
      .where(and(
        eq(reminders.userId, userId),
        eq(reminders.isCompleted, false),
        sql`${reminders.reminderDate} >= ${today}`
      ))
      .orderBy(reminders.reminderDate);
  }

  async getReminder(id: number): Promise<Reminder | undefined> {
    const [reminder] = await db.select().from(reminders).where(eq(reminders.id, id));
    return reminder;
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const [newReminder] = await db.insert(reminders).values(reminder).returning();
    return newReminder;
  }

  async updateReminder(id: number, reminder: Partial<InsertReminder>): Promise<Reminder | undefined> {
    const [updated] = await db.update(reminders).set(reminder).where(eq(reminders.id, id)).returning();
    return updated;
  }

  async deleteReminder(id: number): Promise<void> {
    await db.delete(reminders).where(eq(reminders.id, id));
  }

  async markReminderCompleted(id: number): Promise<Reminder | undefined> {
    const [updated] = await db.update(reminders).set({ isCompleted: true }).where(eq(reminders.id, id)).returning();
    return updated;
  }

  // Admin analytics methods
  async getAdminMetrics(): Promise<{
    totalUsers: number;
    premiumUsers: number;
    activeUsersToday: number;
    activeUsersThisWeek: number;
    activeUsersThisMonth: number;
    newUsersThisWeek: number;
    totalPets: number;
  }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsersResult] = await db.select({ count: count() }).from(users);
    const [premiumUsersResult] = await db.select({ count: count() }).from(users).where(eq(users.isPremium, true));
    const [totalPetsResult] = await db.select({ count: count() }).from(pets);
    
    const [newUsersResult] = await db.select({ count: count() }).from(users)
      .where(sql`${users.createdAt} >= ${weekAgo}`);

    // Active users based on feature usage
    const activeTodayResult = await db.execute(
      sql`SELECT COUNT(DISTINCT user_id) as count FROM feature_usage WHERE last_used_at >= ${todayStart}`
    );
    const activeWeekResult = await db.execute(
      sql`SELECT COUNT(DISTINCT user_id) as count FROM feature_usage WHERE last_used_at >= ${weekAgo}`
    );
    const activeMonthResult = await db.execute(
      sql`SELECT COUNT(DISTINCT user_id) as count FROM feature_usage WHERE last_used_at >= ${monthAgo}`
    );

    return {
      totalUsers: totalUsersResult.count,
      premiumUsers: premiumUsersResult.count,
      activeUsersToday: Number((activeTodayResult.rows[0] as any)?.count || 0),
      activeUsersThisWeek: Number((activeWeekResult.rows[0] as any)?.count || 0),
      activeUsersThisMonth: Number((activeMonthResult.rows[0] as any)?.count || 0),
      newUsersThisWeek: newUsersResult.count,
      totalPets: totalPetsResult.count,
    };
  }

  async getTopFeatures(limit: number = 10): Promise<{ featureName: string; totalUsage: number; uniqueUsers: number }[]> {
    const result = await db.execute(
      sql`SELECT 
        feature_name as "featureName", 
        SUM(usage_count) as "totalUsage",
        COUNT(DISTINCT user_id) as "uniqueUsers"
      FROM feature_usage 
      GROUP BY feature_name 
      ORDER BY "totalUsage" DESC 
      LIMIT ${limit}`
    );
    return result.rows.map((row: any) => ({
      featureName: row.featureName,
      totalUsage: Number(row.totalUsage),
      uniqueUsers: Number(row.uniqueUsers),
    }));
  }

  async getUserGrowth(days: number = 30): Promise<{ date: string; count: number }[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await db.execute(
      sql`SELECT 
        DATE(created_at) as date, 
        COUNT(*) as count 
      FROM users 
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at) 
      ORDER BY date ASC`
    );
    return result.rows.map((row: any) => ({
      date: row.date,
      count: Number(row.count),
    }));
  }

  async setUserAdmin(userId: string, isAdmin: boolean): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ isAdmin, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async setUserPremium(userId: string, isPremium: boolean): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ isPremium, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async setUserAdFree(userId: string, adFree: boolean): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ adFree, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
