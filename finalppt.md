LEARN: SMART ACADEMIC COMPANION INTEGRATING KNOWLEDGE GRAPH ALGORITHMS, TRANSFORMER-BASED AND SEMANTIC NLP FOR PERSONALIZED LEARNING 

79010636| Sunav Sharma 

Title defense of Project Work – CSC 422– Class of 2026 

## Outline 

- Introduction 

- Problem Statement 

- Objective 

- Scope 

- Literature Review/Background Study 

- Methodology 

- Tools and Technology 

- Result 

- Future Work 

- Conclusion 

- Reference 

2 

## Introduction 

- Students and educators face challenges managing information overload and diverse 

   - learning needs 

- Learners Companion leverages AI to create an intuitive, efficient, and personalized 

   - learning platform 

- Empowers students to actively manage their learning journeys with tailored support 

- Features include voice note transcription, automated essay grading, personalized learning paths, PDF summarization, and real-time collaboration 

3 

## Problem Statement 

- Students struggle with fragmented learning processes that don’t meet their core educational needs 

- Ineffective note-taking leads to disorganized, unsearchable information and loss of valuable 

## insights 

- Learners spend excessive time searching for previously captured content instead of focusing on 

   - learning 

- Traditional educational methods fail to keep pace with modern learning requirements and 

   - personalized needs 

4 

## Requirement Analysis 

## **a) Functional Requirement** 

- Users shall be able to register and securely log in. 

- User shall be able to record voice. 

- User shall be able to see organized voice note transcribes. 

- User shall be able to input their learning goals and receive customized paths 

- User shall be able to view their progress 

- The system shall allow users to record voice notes 

- The system shall analyze the content of notes and classify them 

- The system shall provide automated grading 

- The system shall analyze skills and generate tailored learning paths 

- Admin shall be able to manage user accounts. 

5 

## Requirement Analysis 

## **b) Non-Functional Requirement** 

- The application must be responsive. 

- The application must ensure high availability 

- The application must prioritize data security and privacy. 

- The application must be user friendly with easy navigation through different processes. 

- The application must me modular to support easy updates and future enhancements. 

6 

## Use Case Diagram 

## **Figure 2: Use Case Diagram for LEARN: SMART ACADEMIC COMPANION** 

7 

## Algorithm Details 

## **NLP Feature Extraction** 

- Analyzes the vocabulary richness of student essays and uploaded documents. 

• Formula: TTR = |V| / |T| 

|V| = number of unique word types 

|T| = total number of word tokens 

TTR ∈ (0, 1] — higher value = richer vocabulary 

- Measures the lexical diversity of a text by comparing unique words to the total number of 

words. 

8 

## Algorithm Details 

## **Heuristic Essay Sorting** 

- Evaluates the quality of a student's essay using predefined scoring rules instead of relying 

   - entirely on AI-generated judgments. 

- Formula: Final Score=(0.25G)+(0.20V)+(0.25Co)+(0.30C) 

G = Grammar Score V = Vocabulary Score Co = Coherence Score C = Content Score 

- Calculates the overall essay score using weighted evaluation criteria. 

9 

## Algorithm Details 

## **Topological Learning Path Generation** 

- The system represents each learning topic as a node and each prerequisite relationship as a directed edge in a Directed Acyclic Graph (DAG) 

- Sorting produces a valid order of study, ensuring that no topic is learned before its prerequisites 

- Generates a learning sequence that satisfies all prerequisite relationships 

10 

## Algorithm Details 

## **Voice Transcription and Sematic Tagging** 

- Automatic Speech Recognition (Whisper) 

- Converts spoken audio into editable text 

_Audio Input→Whisper Model→Text Output_ 

- Transforms spoken audio into accurate text for further NLP processing 

- Automatically classifies notes into academic subjects 

- Measures how strongly a document matches a subject using keyword frequencies 

11 

## Algorithm Details 

## **Real-time Data Synchronization** 

- WebSocket Broadcast Algorithm 

- Synchronizes messages and whiteboard updates among connected users in real time. 

- Distributes real-time updates instantly to every active client without repeated requests. 

12 

## Implementation 

## **Tools and Technology** 

- React 

- Vite 

- Tailwind CSS 

- FastAPI 

- OpenAI Whisper 

- spaCy 

- NetworkX 

- TextBlob 

- WebSockets 

13 

## Implementation 

## **Module 1: AI Voice Transcription ( Whisper )** 

whisper_model = whisper.load_model("base") def transcribe_audio(file_path): result = whisper_model.transcribe( file_path, language="en" ) return result["text"] 

14 

## Implementation 

## **Module 2: NLP Essay Grader** 

for token in doc: 

if not token.is_stop: 

keyword_freq[token.text.lower()] += 1 sentence_scores[sent] += keyword_freq[word] summary = sorted( sentence_scores, key=sentence_scores.get, 

reverse=True ) 

15 

## Implementation 

## **Module 3: PDF Summarization** 

valid_transitions = { 

"however", "therefore", 

"furthermore", "thus" 

} 

transition_count = sum( 

1 for s in sentences 

if any(t in s.lower() for t in valid_transitions) ) 

variance = np.var(sentence_lengths) 

16 

## Implementation 

## **Module 4: Learning Path Generator** 

G = nx.DiGraph() 

G.add_edge(prerequisite, topic) 

learning_path = list( nx.topological_sort(G) ) 

17 

## Implementation 

## **Module 5: WebSocket Communication** 

await websocket.accept() 

self.active_connections[community_id].append(websocket) 

for connection in self.active_connections[community_id]: await connection.send_json(message) 

18 

## Conclusion 

- Consolidates essential study tools into one intelligent, unified learning platform 

- Empowers students to capture, organize, and review knowledge more 

   - effectively 

- Supports self-directed learning with AI-driven feedback and personalized 

   - guidance 

- Promotes accessible and technology-driven education for all learners 

19 

## Results 

20 

## Results 

21 

## Results 

22 

## Results 

23 

## Results 

24 

## Results 

25 

## Results 

26 

## Results 

27 

## Thank You!!!!! 

28 

