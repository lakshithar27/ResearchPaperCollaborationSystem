// ============================================================
// ResearchHub: Neo4j Graph Database Setup & Cypher Queries
// File: researchhub_neo4j.cypher
//
// Run these statements in Neo4j Browser (http://localhost:7474)
// or Neo4j Desktop to visualize the Citation & Co-authorship Graph.
// ============================================================

// 1. CONSTRAINTS & INDEXES
CREATE CONSTRAINT IF NOT EXISTS FOR (r:Researcher) REQUIRE r.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (p:Paper) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (t:Topic) REQUIRE t.id IS UNIQUE;

// 2. CREATE NODES

// A. Topics
MERGE (t1:Topic {id: 1, name: "Machine Learning", description: "Algorithms that learn patterns from data"});
MERGE (t2:Topic {id: 2, name: "Natural Language Processing", description: "Computational methods for human language"});
MERGE (t3:Topic {id: 3, name: "Recommendation Systems", description: "Personalized ranking and collaborative filtering"});
MERGE (t4:Topic {id: 4, name: "Data Mining", description: "Discovering useful patterns in large datasets"});

// B. Researchers
MERGE (r1:Researcher {id: 1, name: "Aarav Sharma", email: "aarav.demo@researchhub.test", affiliation: "PES University", researchArea: "Machine Learning", role: "Researcher"});
MERGE (r2:Researcher {id: 2, name: "Diya Rao", email: "diya.demo@researchhub.test", affiliation: "PES University", researchArea: "Data Science", role: "Student"});
MERGE (r3:Researcher {id: 3, name: "Kabir Mehta", email: "kabir.demo@researchhub.test", affiliation: "IISc Bengaluru", researchArea: "Natural Language Processing", role: "Researcher"});
MERGE (r4:Researcher {id: 4, name: "System Administrator", email: "admin@researchhub.test", affiliation: "ResearchHub Core Team", researchArea: "System Architecture", role: "Admin"});

// C. Papers
MERGE (p1:Paper {id: 1, title: "A Survey of Machine Learning Recommendation Methods", year: 2024, doi: "10.5555/researchhub.demo.001", venue: "Journal of Research Systems", citationCount: 1});
MERGE (p2:Paper {id: 2, title: "Neural Methods for Scientific Text Retrieval", year: 2025, doi: "10.5555/researchhub.demo.002", venue: "Conference on Applied AI", citationCount: 0});
MERGE (p3:Paper {id: 3, title: "Mining Research Trends from Academic Publications", year: 2023, doi: "10.5555/researchhub.demo.003", venue: "Data Analytics Review", citationCount: 0});

// 3. CREATE RELATIONSHIPS

// Authorships (:Researcher)-[:AUTHORED]->(:Paper)
MATCH (r1:Researcher {id: 1}), (p1:Paper {id: 1}) MERGE (r1)-[:AUTHORED {order: 1, role: "Lead Author"}]->(p1);
MATCH (r2:Researcher {id: 2}), (p1:Paper {id: 1}) MERGE (r2)-[:AUTHORED {order: 2, role: "Co-Author"}]->(p1);
MATCH (r3:Researcher {id: 3}), (p2:Paper {id: 2}) MERGE (r3)-[:AUTHORED {order: 1, role: "Lead Author"}]->(p2);
MATCH (r2:Researcher {id: 2}), (p3:Paper {id: 3}) MERGE (r2)-[:AUTHORED {order: 1, role: "Lead Author"}]->(p3);

// Topics (:Paper)-[:TAGGED_WITH]->(:Topic)
MATCH (p1:Paper {id: 1}), (t1:Topic {id: 1}) MERGE (p1)-[:TAGGED_WITH]->(t1);
MATCH (p1:Paper {id: 1}), (t3:Topic {id: 3}) MERGE (p1)-[:TAGGED_WITH]->(t3);
MATCH (p2:Paper {id: 2}), (t1:Topic {id: 1}) MERGE (p2)-[:TAGGED_WITH]->(t1);
MATCH (p2:Paper {id: 2}), (t2:Topic {id: 2}) MERGE (p2)-[:TAGGED_WITH]->(t2);
MATCH (p3:Paper {id: 3}), (t4:Topic {id: 4}) MERGE (p3)-[:TAGGED_WITH]->(t4);

// Citations (:Paper)-[:CITES]->(:Paper)
MATCH (p2:Paper {id: 2}), (p1:Paper {id: 1}) MERGE (p2)-[:CITES {date: "2026-11-05"}]->(p1);

// ============================================================
// 4. GRAPH ANALYTICS CYPHER QUERIES (FOR DEMO & EVALUATION)
// ============================================================

// Query 1: Visualize the complete ResearchHub Knowledge Graph
// MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 100;

// Query 2: Find all papers citing a specific paper
// MATCH (citing:Paper)-[r:CITES]->(target:Paper {id: 1})
// RETURN citing.title AS CitingPaper, target.title AS TargetPaper;

// Query 3: Multi-hop citation network (Paper -> cited paper -> papers cited by that paper)
// MATCH path = (p:Paper)-[:CITES*1..2]->(cited:Paper)
// RETURN path;

// Query 4: Co-authorship collaboration network
// MATCH (r1:Researcher)-[:AUTHORED]->(p:Paper)<-[:AUTHORED]-(r2:Researcher)
// WHERE id(r1) < id(r2)
// RETURN r1.name AS Researcher1, r2.name AS Researcher2, p.title AS SharedPaper;

// Query 5: Discover influential papers by incoming citation count in the graph
// MATCH (cited:Paper)<-[c:CITES]-()
// RETURN cited.title AS PaperTitle, count(c) AS InDegreeCitations
// ORDER BY InDegreeCitations DESC;

// Query 6: Find researchers working on common topics through papers
// MATCH (r:Researcher)-[:AUTHORED]->(p:Paper)-[:TAGGED_WITH]->(t:Topic)
// RETURN t.name AS Topic, collect(DISTINCT r.name) AS Researchers;


// ============================================================
// EXPANDED PAPERS (17 - 40) AND CITATION EDGES
// ============================================================

MERGE (p:Paper {id: 17}) SET p.title = 'Language Models are Few-Shot Learners (GPT-3)', p.year = 2020, p.venue = 'NeurIPS Conference on Neural Information Processing Systems', p.citationCount = 3;
MERGE (p:Paper {id: 18}) SET p.title = 'LLaMA: Open and Efficient Foundation Language Models', p.year = 2023, p.venue = 'Meta AI Technical Report', p.citationCount = 1;
MERGE (p:Paper {id: 19}) SET p.title = 'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning', p.year = 2025, p.venue = 'International Conference on Learning Representations (ICLR)', p.citationCount = 0;
MERGE (p:Paper {id: 20}) SET p.title = 'LoRA: Low-Rank Adaptation of Large Language Models', p.year = 2022, p.venue = 'International Conference on Learning Representations (ICLR)', p.citationCount = 1;
MERGE (p:Paper {id: 21}) SET p.title = 'Direct Preference Optimization: Your Language Model is Secretly a Reward Model', p.year = 2023, p.venue = 'NeurIPS Conference on Neural Information Processing Systems', p.citationCount = 1;
MERGE (p:Paper {id: 22}) SET p.title = 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness', p.year = 2022, p.venue = 'NeurIPS Conference on Neural Information Processing Systems', p.citationCount = 1;
MERGE (p:Paper {id: 23}) SET p.title = 'FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning', p.year = 2024, p.venue = 'International Conference on Learning Representations (ICLR)', p.citationCount = 0;
MERGE (p:Paper {id: 24}) SET p.title = 'Spanner: Google\'s Globally Distributed Database', p.year = 2023, p.venue = 'ACM Transactions on Computer Systems (TOCS)', p.citationCount = 1;
MERGE (p:Paper {id: 25}) SET p.title = 'ResNet-v2: Identity Mappings in Deep Residual Networks', p.year = 2022, p.venue = 'European Conference on Computer Vision (ECCV)', p.citationCount = 0;
MERGE (p:Paper {id: 26}) SET p.title = 'Learning Transferable Visual Models From Natural Language Supervision (CLIP)', p.year = 2021, p.venue = 'International Conference on Machine Learning (ICML)', p.citationCount = 1;
MERGE (p:Paper {id: 27}) SET p.title = 'Segment Anything: Foundational Models for Computer Vision', p.year = 2023, p.venue = 'IEEE/CVF International Conference on Computer Vision (ICCV)', p.citationCount = 0;
MERGE (p:Paper {id: 28}) SET p.title = 'High-Resolution Image Synthesis with Latent Diffusion Models', p.year = 2022, p.venue = 'IEEE/CVF Conference on Computer Vision and Pattern Recognition', p.citationCount = 0;
MERGE (p:Paper {id: 29}) SET p.title = 'Semi-Supervised Classification with Graph Convolutional Networks (GCN)', p.year = 2021, p.venue = 'International Conference on Learning Representations (ICLR)', p.citationCount = 2;
MERGE (p:Paper {id: 30}) SET p.title = 'Inductive Representation Learning on Large Graphs (GraphSAGE)', p.year = 2022, p.venue = 'NeurIPS Conference on Neural Information Processing Systems', p.citationCount = 1;
MERGE (p:Paper {id: 31}) SET p.title = 'Fast Graph Representation Learning with PyTorch Geometric', p.year = 2023, p.venue = 'International Conference on Learning Representations (ICLR)', p.citationCount = 0;
MERGE (p:Paper {id: 32}) SET p.title = 'Faiss: A Library for Efficient Similarity Search and Dense Clustering', p.year = 2021, p.venue = 'IEEE Transactions on Big Data', p.citationCount = 1;
MERGE (p:Paper {id: 33}) SET p.title = 'HNSW: Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs', p.year = 2022, p.venue = 'IEEE Transactions on Pattern Analysis and Machine Intelligence', p.citationCount = 0;
MERGE (p:Paper {id: 34}) SET p.title = 'Snowflake: The Architecture of an Elastic Data Warehouse', p.year = 2023, p.venue = 'ACM SIGMOD International Conference on Management of Data', p.citationCount = 1;
MERGE (p:Paper {id: 35}) SET p.title = 'DuckDB: An Embeddable Analytical Database for In-Process OLAP', p.year = 2023, p.venue = 'VLDB International Conference on Very Large Data Bases', p.citationCount = 0;
MERGE (p:Paper {id: 36}) SET p.title = 'TAO: Facebook’s Distributed Data Store for the Social Graph', p.year = 2022, p.venue = 'USENIX Annual Technical Conference (ATC)', p.citationCount = 0;
MERGE (p:Paper {id: 37}) SET p.title = 'Spectre Attacks: Exploiting Speculative Execution in Hardware', p.year = 2022, p.venue = 'IEEE Symposium on Security and Privacy (S&P)', p.citationCount = 1;
MERGE (p:Paper {id: 38}) SET p.title = 'SoK: Decentralized Finance (DeFi) Security and Privacy Paradigms', p.year = 2023, p.venue = 'IEEE Symposium on Security and Privacy (S&P)', p.citationCount = 0;
MERGE (p:Paper {id: 39}) SET p.title = 'Fault-Tolerant Quantum Computation with Surface Codes', p.year = 2022, p.venue = 'Physical Review A', p.citationCount = 1;
MERGE (p:Paper {id: 40}) SET p.title = 'Quantum Supremacy Using a Programmable Superconducting Processor', p.year = 2021, p.venue = 'Nature International Journal of Science', p.citationCount = 0;

// Expanded Citations
MATCH (c:Paper {id: 29}), (t:Paper {id: 4}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 17}), (t:Paper {id: 5}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 18}), (t:Paper {id: 5}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 19}), (t:Paper {id: 5}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 20}), (t:Paper {id: 5}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 21}), (t:Paper {id: 5}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 22}), (t:Paper {id: 5}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 23}), (t:Paper {id: 5}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 26}), (t:Paper {id: 5}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 28}), (t:Paper {id: 5}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 30}), (t:Paper {id: 7}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 32}), (t:Paper {id: 8}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 33}), (t:Paper {id: 8}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 25}), (t:Paper {id: 9}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 26}), (t:Paper {id: 9}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 27}), (t:Paper {id: 9}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 28}), (t:Paper {id: 9}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 24}), (t:Paper {id: 11}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 34}), (t:Paper {id: 11}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 35}), (t:Paper {id: 11}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 36}), (t:Paper {id: 11}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 37}), (t:Paper {id: 13}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 39}), (t:Paper {id: 14}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 40}), (t:Paper {id: 14}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 18}), (t:Paper {id: 17}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 20}), (t:Paper {id: 17}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 21}), (t:Paper {id: 17}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 19}), (t:Paper {id: 18}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 16}), (t:Paper {id: 20}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 19}), (t:Paper {id: 21}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 23}), (t:Paper {id: 22}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 36}), (t:Paper {id: 24}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 27}), (t:Paper {id: 26}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 30}), (t:Paper {id: 29}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 31}), (t:Paper {id: 29}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 31}), (t:Paper {id: 30}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 33}), (t:Paper {id: 32}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 35}), (t:Paper {id: 34}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 38}), (t:Paper {id: 37}) MERGE (c)-[:CITES]->(t);
MATCH (c:Paper {id: 40}), (t:Paper {id: 39}) MERGE (c)-[:CITES]->(t);
