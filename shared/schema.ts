import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  serial,
  boolean,
  date,
  decimal,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isPremium: boolean("is_premium").default(false),
  isAdmin: boolean("is_admin").default(false),
  adFree: boolean("ad_free").default(false),
  stripeCustomerId: varchar("stripe_customer_id"),
  authMethod: varchar("auth_method", { length: 20 }).default("email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password reset codes (sent via email only for password reset)
export const passwordResetCodes = pgTable("password_reset_codes", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  code: varchar("code", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pets table
export const pets = pgTable("pets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  species: varchar("species", { length: 50 }).notNull(),
  breed: varchar("breed", { length: 100 }),
  dateOfBirth: date("date_of_birth"),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  gender: varchar("gender", { length: 20 }),
  color: varchar("color", { length: 50 }),
  microchipId: varchar("microchip_id", { length: 50 }),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Health records table
export const healthRecords = pgTable("health_records", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").notNull().references(() => pets.id, { onDelete: "cascade" }),
  recordType: varchar("record_type", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  date: date("date").notNull(),
  veterinarian: varchar("veterinarian", { length: 100 }),
  clinic: varchar("clinic", { length: 100 }),
  photos: text("photos").array(),
  reminderDate: date("reminder_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Medications table
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").notNull().references(() => pets.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  dosage: varchar("dosage", { length: 100 }),
  frequency: varchar("frequency", { length: 100 }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  refillDate: date("refill_date"),
  instructions: text("instructions"),
  photos: text("photos").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").notNull().references(() => pets.id, { onDelete: "cascade" }),
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  duration: integer("duration"),
  distance: decimal("distance", { precision: 6, scale: 2 }),
  date: date("date").notNull(),
  notes: text("notes"),
  routeData: jsonb("route_data"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity goals table
export const activityGoals = pgTable("activity_goals", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").notNull().references(() => pets.id, { onDelete: "cascade" }),
  goalType: varchar("goal_type", { length: 50 }).notNull(),
  targetValue: integer("target_value").notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Nutrition logs table
export const nutritionLogs = pgTable("nutrition_logs", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").notNull().references(() => pets.id, { onDelete: "cascade" }),
  mealType: varchar("meal_type", { length: 50 }).notNull(),
  foodName: varchar("food_name", { length: 200 }),
  amount: decimal("amount", { precision: 6, scale: 2 }),
  unit: varchar("unit", { length: 20 }),
  calories: integer("calories"),
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Hydration logs table
export const hydrationLogs = pgTable("hydration_logs", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").notNull().references(() => pets.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 6, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 20 }).default("ml"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Behavior logs table
export const behaviorLogs = pgTable("behavior_logs", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").notNull().references(() => pets.id, { onDelete: "cascade" }),
  behaviorType: varchar("behavior_type", { length: 100 }).notNull(),
  severity: varchar("severity", { length: 20 }),
  description: text("description"),
  triggers: text("triggers"),
  aiSuggestion: text("ai_suggestion"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Training resources table
export const trainingResources = pgTable("training_resources", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  contentUrl: text("content_url"),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"),
  difficulty: varchar("difficulty", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  petId: integer("pet_id").references(() => pets.id, { onDelete: "set null" }),
  category: varchar("category", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: varchar("description", { length: 200 }),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Emergency contacts table
export const emergencyContacts = pgTable("emergency_contacts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  contactType: varchar("contact_type", { length: 50 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  notes: text("notes"),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// First aid guides table
export const firstAidGuides = pgTable("first_aid_guides", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  severity: varchar("severity", { length: 20 }),
  symptoms: text("symptoms"),
  steps: text("steps").notNull(),
  whenToSeekHelp: text("when_to_seek_help"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Feature usage analytics table
export const featureUsage = pgTable("feature_usage", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  featureName: varchar("feature_name", { length: 100 }).notNull(),
  usageCount: integer("usage_count").default(1),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
});

// Reminders table
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  petId: integer("pet_id").references(() => pets.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  reminderType: varchar("reminder_type", { length: 50 }).notNull(),
  reminderDate: date("reminder_date").notNull(),
  reminderTime: varchar("reminder_time", { length: 10 }),
  isRecurring: boolean("is_recurring").default(false),
  recurringInterval: varchar("recurring_interval", { length: 20 }),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI meal plans table
export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").notNull().references(() => pets.id, { onDelete: "cascade" }),
  planContent: text("plan_content").notNull(),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Local services table
export const localServices = pgTable("local_services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  address: text("address").notNull(),
  phone: varchar("phone", { length: 30 }),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Service reviews table
export const serviceReviews = pgTable("service_reviews", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => localServices.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Forum posts table
export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Forum comments table
export const forumComments = pgTable("forum_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => forumPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  plan: varchar("plan", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  pets: many(pets),
  expenses: many(expenses),
  emergencyContacts: many(emergencyContacts),
  featureUsage: many(featureUsage),
}));

export const petsRelations = relations(pets, ({ one, many }) => ({
  user: one(users, { fields: [pets.userId], references: [users.id] }),
  healthRecords: many(healthRecords),
  medications: many(medications),
  activities: many(activities),
  activityGoals: many(activityGoals),
  nutritionLogs: many(nutritionLogs),
  hydrationLogs: many(hydrationLogs),
  behaviorLogs: many(behaviorLogs),
  expenses: many(expenses),
  mealPlans: many(mealPlans),
}));

export const healthRecordsRelations = relations(healthRecords, ({ one }) => ({
  pet: one(pets, { fields: [healthRecords.petId], references: [pets.id] }),
}));

export const medicationsRelations = relations(medications, ({ one }) => ({
  pet: one(pets, { fields: [medications.petId], references: [pets.id] }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  pet: one(pets, { fields: [activities.petId], references: [pets.id] }),
}));

export const activityGoalsRelations = relations(activityGoals, ({ one }) => ({
  pet: one(pets, { fields: [activityGoals.petId], references: [pets.id] }),
}));

export const nutritionLogsRelations = relations(nutritionLogs, ({ one }) => ({
  pet: one(pets, { fields: [nutritionLogs.petId], references: [pets.id] }),
}));

export const hydrationLogsRelations = relations(hydrationLogs, ({ one }) => ({
  pet: one(pets, { fields: [hydrationLogs.petId], references: [pets.id] }),
}));

export const behaviorLogsRelations = relations(behaviorLogs, ({ one }) => ({
  pet: one(pets, { fields: [behaviorLogs.petId], references: [pets.id] }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, { fields: [expenses.userId], references: [users.id] }),
  pet: one(pets, { fields: [expenses.petId], references: [pets.id] }),
}));

export const emergencyContactsRelations = relations(emergencyContacts, ({ one }) => ({
  user: one(users, { fields: [emergencyContacts.userId], references: [users.id] }),
}));

export const featureUsageRelations = relations(featureUsage, ({ one }) => ({
  user: one(users, { fields: [featureUsage.userId], references: [users.id] }),
}));

export const mealPlansRelations = relations(mealPlans, ({ one }) => ({
  pet: one(pets, { fields: [mealPlans.petId], references: [pets.id] }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, { fields: [reminders.userId], references: [users.id] }),
  pet: one(pets, { fields: [reminders.petId], references: [pets.id] }),
}));

export const localServicesRelations = relations(localServices, ({ many }) => ({
  reviews: many(serviceReviews),
}));

export const serviceReviewsRelations = relations(serviceReviews, ({ one }) => ({
  service: one(localServices, { fields: [serviceReviews.serviceId], references: [localServices.id] }),
  user: one(users, { fields: [serviceReviews.userId], references: [users.id] }),
}));

export const forumPostsRelations = relations(forumPosts, ({ one, many }) => ({
  user: one(users, { fields: [forumPosts.userId], references: [users.id] }),
  comments: many(forumComments),
}));

export const forumCommentsRelations = relations(forumComments, ({ one }) => ({
  post: one(forumPosts, { fields: [forumComments.postId], references: [forumPosts.id] }),
  user: one(users, { fields: [forumComments.userId], references: [users.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ createdAt: true, updatedAt: true });
export const insertPetSchema = createInsertSchema(pets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHealthRecordSchema = createInsertSchema(healthRecords).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMedicationSchema = createInsertSchema(medications).omit({ id: true, createdAt: true, updatedAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export const insertActivityGoalSchema = createInsertSchema(activityGoals).omit({ id: true, createdAt: true });
export const insertNutritionLogSchema = createInsertSchema(nutritionLogs).omit({ id: true, createdAt: true });
export const insertHydrationLogSchema = createInsertSchema(hydrationLogs).omit({ id: true, createdAt: true });
export const insertBehaviorLogSchema = createInsertSchema(behaviorLogs).omit({ id: true, createdAt: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({ id: true, createdAt: true });
export const insertFeatureUsageSchema = createInsertSchema(featureUsage).omit({ id: true, lastUsedAt: true });
export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({ id: true, generatedAt: true });
export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true });
export const insertLocalServiceSchema = createInsertSchema(localServices).omit({ id: true, createdAt: true });
export const insertServiceReviewSchema = createInsertSchema(serviceReviews).omit({ id: true, createdAt: true });
export const insertForumPostSchema = createInsertSchema(forumPosts).omit({ id: true, createdAt: true });
export const insertForumCommentSchema = createInsertSchema(forumComments).omit({ id: true, createdAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertPet = z.infer<typeof insertPetSchema>;
export type Pet = typeof pets.$inferSelect;
export type InsertHealthRecord = z.infer<typeof insertHealthRecordSchema>;
export type HealthRecord = typeof healthRecords.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = typeof medications.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivityGoal = z.infer<typeof insertActivityGoalSchema>;
export type ActivityGoal = typeof activityGoals.$inferSelect;
export type InsertNutritionLog = z.infer<typeof insertNutritionLogSchema>;
export type NutritionLog = typeof nutritionLogs.$inferSelect;
export type InsertHydrationLog = z.infer<typeof insertHydrationLogSchema>;
export type HydrationLog = typeof hydrationLogs.$inferSelect;
export type InsertBehaviorLog = z.infer<typeof insertBehaviorLogSchema>;
export type BehaviorLog = typeof behaviorLogs.$inferSelect;
export type TrainingResource = typeof trainingResources.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type FirstAidGuide = typeof firstAidGuides.$inferSelect;
export type InsertFeatureUsage = z.infer<typeof insertFeatureUsageSchema>;
export type FeatureUsage = typeof featureUsage.$inferSelect;
export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertLocalService = z.infer<typeof insertLocalServiceSchema>;
export type LocalService = typeof localServices.$inferSelect;
export type InsertServiceReview = z.infer<typeof insertServiceReviewSchema>;
export type ServiceReview = typeof serviceReviews.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumComment = z.infer<typeof insertForumCommentSchema>;
export type ForumComment = typeof forumComments.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export * from "./models/chat";
