import { db } from "@/app/db/index";
import { questions, answers, comments } from "@/app/db/schema";
import { eq, count, and } from "drizzle-orm";

async function syncCounts() {
  console.log("Syncing counts...");
  const allQuestions = await db.select().from(questions);
  
  for (const q of allQuestions) {
    const [{ value: aCount }] = await db.select({ value: count() }).from(answers).where(eq(answers.questionId, q.id));
    const [{ value: cCount }] = await db.select({ value: count() }).from(comments).where(and(eq(comments.parentId, q.id), eq(comments.parentType, "question")));
    
    await db.update(questions).set({
      answerCount: aCount,
      commentCount: cCount
    }).where(eq(questions.id, q.id));
    
    console.log(`Updated question ${q.id}: ${aCount} answers, ${cCount} comments`);
  }
  
  const allAnswers = await db.select().from(answers);
  for (const a of allAnswers) {
    const [{ value: cCount }] = await db.select({ value: count() }).from(comments).where(and(eq(comments.parentId, a.id), eq(comments.parentType, "answer")));
    await db.update(answers).set({
      commentCount: cCount
    }).where(eq(answers.id, a.id));
    console.log(`Updated answer ${a.id}: ${cCount} comments`);
  }
  
  console.log("Sync complete!");
  process.exit(0);
}

syncCounts().catch(err => {
  console.error(err);
  process.exit(1);
});
