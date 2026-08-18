Doomly is an AI-powered learning app that turns a student’s own syllabus and study material into an addictive, personalized vertical scrolling feed.

The basic philosophy is:

“You’re going to scroll anyway. Doomly makes the scroll useful.”

1. The problem

Students already spend hours scrolling Instagram Reels, Shorts, Reddit, etc.

Traditional studying has much more friction:

Open notes → find chapter → decide what to study → read → get bored → open Instagram.

Doomly tries to remove that friction.

Instead of asking the student to stop scrolling, it takes the behavior they already enjoy and replaces the content.

2. How Doomly works

A student opens Doomly and uploads their material:

* syllabus
* lecture PDFs
* professor notes
* PPTs
* textbook chapters
* assignments
* previous-year papers

For example:

DSA
Computer Networks
COA
Operating Systems

Doomly processes those documents, understands their structure and creates a knowledge base for each subject.

Then AI converts that knowledge into hundreds of small pieces of content.

3. The Doom Feed

This is the heart of the product.

The home screen feels closer to Reels than to a traditional learning app.

You swipe vertically.

Each swipe might show something different.

For example:

POST 1

STACK

Last In, First Out.

Think of a stack of plates.

The last plate you put on top is the first one you remove.

Swipe →

POST 2

QUICK CHECK

Which data structure follows LIFO?

A. Queue
B. Stack
C. Linked List
D. Graph

Tap an answer.

Swipe →

POST 3

CODE BITE

stack.push(10)
stack.push(20)
stack.pop()

What's left on top?

Tap to reveal.

Swipe →

POST 4

EXAM TRAP

Stack overflow ≠ integer overflow.

Here's the difference...

And the student just keeps scrolling.

4. Content shouldn't feel like flashcards

This is important.

If every swipe is:

Question.
Answer.
Question.
Answer.

Doomly becomes Anki with vertical scrolling.

It will get boring.

Instead, Doomly should have different post formats:

* concept cards
* MCQs
* diagrams
* code snippets
* “spot the bug”
* true/false
* fill in the blank
* explain-this-image
* exam traps
* common mistakes
* definitions
* mini problems
* “what happens next?”
* memory cards
* comparison cards
* previous-year questions
* AI-generated visual explanations

The feed constantly changes format.

5. Progressive difficulty

This is one of the most important parts of Doomly.

Suppose the student starts Trees.

Doomly shouldn't immediately show:

“Implement AVL deletion and prove its complexity.”

Instead:

Level 1

What is a tree?

↓

Level 2

Parent / child / leaf nodes

↓

Level 3

Binary trees

↓

Level 4

BST

↓

Level 5

BST insertion

↓

Level 6

Time complexity

↓

Level 7

Solve this BST problem.

The student gradually gets pulled deeper into the topic.

6. The recommendation algorithm

This could eventually become Doomly's biggest competitive advantage.

Every interaction teaches Doomly something.

For example:

Answered correctly
→ increase estimated mastery.

Answered incorrectly
→ show related concepts again later.

Skipped immediately
→ potentially boring/irrelevant.

Spent 20 seconds reading
→ likely interesting or difficult.

Tapped “Explain”
→ concept isn't fully understood.

Saved
→ probably important.

Repeated mistakes
→ increase frequency.

Consistently correct
→ increase difficulty.

So Doomly builds something like:

DSA mastery

Arrays █████████ 92%
Stacks ████████ 84%
Queues ██████ 67%
Trees ████ 43%
Graphs ██ 21%

The feed is generated from this model.

7. Interactions

I'd keep interactions extremely simple.

Swipe up
→ next post

Tap
→ reveal answer / interact

Double tap
→ Got it

Long press
→ Explain more

Swipe right
→ Save for revision

Swipe left
→ Didn't understand

Those interactions feed the recommendation system.

8. Grounded AI

This is crucial.

Doomly shouldn't randomly teach things from the internet when a professor expects something specific.

Default mode:

“Generate content only from uploaded material.”

Every generated post stores its source.

For example:

Source:
CN_Module_4.pdf
Page 37

Student taps it and sees the original material.

That gives Doomly traceability and massively reduces hallucination problems.

Later you could add:

“Go beyond my syllabus”

as an optional mode.

9. Subjects

The student could create spaces like:

My Semester

DSA
CN
COA
OS
Mathematics

They can scroll individual feeds:

DSA only

or use:

For You

Doomly then mixes subjects intelligently.

DSA → CN → DSA → COA → OS → CN...

This prevents mental fatigue from seeing the same subject continuously.

10. Doom Score

Gamification should exist, but I wouldn't make it childish.

Instead of:

“YOU EARNED 20 GOLD COINS!!!”

show useful metrics.

Today

23 concepts seen
17 recalled correctly
11 minutes learned

Weekly

2h 14m Doomly
187 concepts
76% recall

You could have a metric called:

Doom Score

which represents productive scrolling.

11. Exam Mode

Student enters:

Exam: Computer Networks
Date: September 17

Doomly knows:

days remaining
topics remaining
mastery
weak areas

The feed changes automatically.

30 days before exam:
Mostly learning.

7 days before:
More recall and questions.

1 day before:
Definitions, formulas, common mistakes and high-yield revision.

The same feed becomes progressively more exam-focused.

12. Doom Sessions

Students could choose:

5 minute doom

10 minute doom

Infinite doom

Exam panic

Exam Panic would be hilarious but genuinely useful.

It aggressively prioritizes:

important topics
weak concepts
previous-year questions
formulas
frequent mistakes.

13. AI Explain

Any post can have:

“Explain”

Then the student can ask:

“Explain simpler.”

“Why?”

“Give example.”

“Explain in Hinglish.”

“Show code.”

“What's important for exam?”

The AI already knows which source material the post came from.

So conversations remain contextual.

14. Social features — later

I would NOT put these in the MVP.

But eventually Doomly could have:

public decks
college communities
shared subjects
professor feeds
friend streaks
leaderboards
shared notes

Imagine:

Mumbai University
→ Computer Engineering
→ Semester 4
→ Computer Networks

Someone creates a great Doom Pack.

Thousands of students can use it.

That introduces network effects.

15. Doom Packs

This could become a major feature.

A Doom Pack is basically:

PDFs + generated feed + questions + progression.

For example:

“DSA Semester 3 Complete Doom Pack”

Students could share packs.

Eventually professors or creators could publish them.

Potentially even:

Doomly Marketplace

where educators sell premium Doom Packs.

16. MVP

Do NOT build everything above initially.

Version 0.1 should basically have:

Upload PDF
↓
AI processes PDF
↓
AI creates posts
↓
Student vertically scrolls
↓
Student answers/interacts
↓
Doomly adjusts what appears next

That's enough.

I'd build only:

* authentication
* subject creation
* PDF upload
* document processing
* AI-generated cards
* vertical feed
* MCQs
* concept cards
* save
* Got it / Don't understand
* basic mastery tracking
* source citations

If students voluntarily spend 20–30 minutes scrolling that feed, you've validated the fundamental idea.

17. Technical architecture

For an MVP, something like:

Frontend
Next.js

Backend
Next.js API / server functions

Database
PostgreSQL

Authentication
Supabase Auth

Storage
Supabase Storage

Vector database
pgvector

AI
LLM + embeddings

Pipeline:

PDF
↓
text extraction
↓
chunking
↓
embeddings
↓
topic extraction
↓
concept graph
↓
content generation
↓
difficulty classification
↓
feed database

Then the feed engine decides what card comes next.

18. The important technical distinction

Don't generate posts every time someone swipes.

That would be slow and expensive.

Instead:

Upload PDF.

Doomly generates maybe 50–100 initial cards asynchronously.

Those cards go into the database.

Student starts scrolling immediately once enough are ready.

Meanwhile Doomly continues generating more content in the background.

Eventually the system maintains a content buffer.

For example:

100 ready cards
↓
student consumes 20
↓
80 remaining
↓
AI generates another 30

So scrolling always feels instantaneous.

19. What Doomly is NOT

This distinction matters for positioning.

Doomly isn't:

“ChatGPT for PDFs.”

It isn't:

“AI flashcard generator.”

It isn't:

“AI notes summarizer.”

Those markets already have tons of products.

Doomly is:

A personalized learning feed.

The AI is infrastructure.

The feed is the product.

20. Long-term vision

Eventually Doomly could understand:

what you know
what you don't know
what you're forgetting
what your exam requires
what you find difficult
how you learn best

Then every swipe answers:

“What is the single best thing Riyaan should see next?”

That's where this becomes much more interesting than simply turning PDFs into Instagram posts.

The loop is:

Upload → Scroll → Interact → Learn → Adapt → Scroll.

And the simplest pitch I'd keep in our heads while building it:

Doomly

Doomscroll your syllabus.

