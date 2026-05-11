import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
  primaryKey
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const voteDirectionEnum = pgEnum("vote_direction", ["up", "down"]);
export const accountStatusEnum = pgEnum("account_status", ["active", "suspended"]);
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  role: userRoleEnum("role").notNull().default("user"),
  name: text("name"),
  username: varchar("username", { length: 50 }).unique(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  image: text("image"),
  reputation: integer("reputation").notNull().default(0),
  bio: text("bio"),
  gender: text("gender").notNull().default("other"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("banReason"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 300 }).unique().notNull(),
  body: text("body").notNull(),
  tags: text("tags").array().notNull().default([]),
  score: integer("score").default(0),
  viewCount: integer("view_count").default(0),
  answerCount: integer("answer_count").default(0),
  commentCount: integer("comment_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_questions_tags").using("gin", table.tags),
  index("idx_questions_slug").on(table.slug),
]);

export const answers = pgTable("answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id").references(() => questions.id, { onDelete: "cascade" }),
  authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  score: integer("score").default(0),
  isAccepted: boolean("is_accepted").default(false),
  commentCount: integer("comment_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_answers_question_id").on(table.questionId),
]);

export const votes = pgTable("votes", {
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  votableId: uuid("votable_id").notNull(),
  votableType: varchar("votable_type", { length: 20 }).notNull(),
  direction: voteDirectionEnum("direction").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.votableId] }),
  index("idx_votes_target").on(table.votableId),
]);

export const questionViews = pgTable("question_views", {
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }).notNull(),
  questionId: uuid("question_id").references(() => questions.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.questionId] }),
  index("idx_question_views_question").on(table.questionId),
]);

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
  parentId: uuid("parent_id").notNull(),
  parentType: varchar("parent_type", { length: 20 }).notNull(),
  replyToId: uuid("reply_to_id"),
  content: text("content").notNull(),
  score: integer("score").default(0),
  replyCount: integer("reply_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_comments_parent").on(table.parentId),
  index("idx_comments_reply_to").on(table.replyToId),
]);

export const commentFlags = pgTable("comment_flags", {
  id: uuid("id").defaultRandom().primaryKey(),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }).notNull(),
  reportedBy: text("reported_by").references(() => user.id, { onDelete: "set null" }),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_comment_flags_comment").on(table.commentId),
]);

export const answerFlags = pgTable("answer_flags", {
  id: uuid("id").defaultRandom().primaryKey(),
  answerId: uuid("answer_id").references(() => answers.id, { onDelete: "cascade" }).notNull(),
  reportedBy: text("reported_by").references(() => user.id, { onDelete: "set null" }),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_answer_flags_answer").on(table.answerId),
]);

export const questionFlags = pgTable("question_flags", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id").references(() => questions.id, { onDelete: "cascade" }).notNull(),
  reportedBy: text("reported_by").references(() => user.id, { onDelete: "set null" }),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_question_flags_question").on(table.questionId),
]);

export const voteRelations = relations(votes, ({ one }) => ({
  user: one(user, {
    fields: [votes.userId],
    references: [user.id],
  }),
  question: one(questions, {
    fields: [votes.votableId],
    references: [questions.id],
    relationName: "questionVotes",
  }),
  answer: one(answers, {
    fields: [votes.votableId],
    references: [answers.id],
    relationName: "answerVotes",
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  questions: many(questions),
  answers: many(answers),
  comments: many(comments),
  votes: many(votes),
  questionViews: many(questionViews),
  sessions: many(session),
  accounts: many(account),
}));

export const questionRelations = relations(questions, ({ one, many }) => ({
  author: one(user, { fields: [questions.authorId], references: [user.id] }),
  answers: many(answers),
  comments: many(comments, { relationName: "questionComments" }),
  votes: many(votes, { relationName: "questionVotes" }),
  views: many(questionViews),
}));

export const answerRelations = relations(answers, ({ one, many }) => ({
  question: one(questions, { fields: [answers.questionId], references: [questions.id] }),
  author: one(user, { fields: [answers.authorId], references: [user.id] }),
  comments: many(comments, { relationName: "answerComments" }),
  votes: many(votes, { relationName: "answerVotes" }),
}));

export const commentRelations = relations(comments, ({ one, many }) => ({
  author: one(user, {
    fields: [comments.authorId],
    references: [user.id],
  }),
  question: one(questions, {
    fields: [comments.parentId],
    references: [questions.id],
    relationName: "questionComments",
  }),
  answer: one(answers, {
    fields: [comments.parentId],
    references: [answers.id],
    relationName: "answerComments",
  }),
  replies: many(comments, { relationName: "commentReplies" }),
  replyTo: one(comments, {
    fields: [comments.replyToId],
    references: [comments.id],
    relationName: "commentReplies",
  }),
  flags: many(commentFlags),
}));

export const answerFlagRelations = relations(answerFlags, ({ one }) => ({
  answer: one(answers, { fields: [answerFlags.answerId], references: [answers.id] }),
  reporter: one(user, { fields: [answerFlags.reportedBy], references: [user.id] }),
}));

export const questionFlagRelations = relations(questionFlags, ({ one }) => ({
  question: one(questions, { fields: [questionFlags.questionId], references: [questions.id] }),
  reporter: one(user, { fields: [questionFlags.reportedBy], references: [user.id] }),
}));

export const commentFlagRelations = relations(commentFlags, ({ one }) => ({
  comment: one(comments, { fields: [commentFlags.commentId], references: [comments.id] }),
  reporter: one(user, { fields: [commentFlags.reportedBy], references: [user.id] }),
}));
