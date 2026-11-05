-- ============================================================
-- ResearchHub: Research Paper Collaboration & Recommendation System
-- Database: MySQL 8.0+
-- File: researchhub_database.sql
--
-- Run this script in MySQL Workbench or the MySQL command line.
-- It creates the database, tables, constraints, indexes, views,
-- triggers, stored procedures, and a small set of demonstration data.
--
-- NOTE: This script does NOT drop an existing database or tables.
-- ============================================================

DROP DATABASE IF EXISTS ResearchPaperDB;
CREATE DATABASE ResearchPaperDB
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

USE ResearchPaperDB;

-- ============================================================
-- 1. TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS Researchers (
    ResearcherID BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    Name         VARCHAR(120) NOT NULL,
    Email        VARCHAR(255) NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Affiliation  VARCHAR(180),
    ResearchArea VARCHAR(180),
    ORCID        VARCHAR(19),
    Role         ENUM('Student', 'Researcher', 'Admin') NOT NULL DEFAULT 'Student',
    JoinedDate   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_researchers_email UNIQUE (Email),
    CONSTRAINT uq_researchers_orcid UNIQUE (ORCID)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Papers (
    PaperID          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    Title            VARCHAR(500) NOT NULL,
    Abstract         TEXT,
    PublicationYear  YEAR,
    DOI              VARCHAR(255),
    Venue            VARCHAR(255),
    PublicationDate  DATE,
    CitationCount    INT UNSIGNED NOT NULL DEFAULT 0,
    PaperURL         VARCHAR(1000),
    UploadedBy       BIGINT UNSIGNED,
    CreatedAt        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_papers_doi UNIQUE (DOI),
    CONSTRAINT fk_papers_uploader
        FOREIGN KEY (UploadedBy) REFERENCES Researchers(ResearcherID)
        ON DELETE SET NULL,
    CONSTRAINT chk_papers_citation_count CHECK (CitationCount >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Topics (
    TopicID      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    TopicName    VARCHAR(120) NOT NULL,
    Description  TEXT,
    CONSTRAINT uq_topics_name UNIQUE (TopicName)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Paper_Authors (
    PaperID       BIGINT UNSIGNED NOT NULL,
    ResearcherID  BIGINT UNSIGNED NOT NULL,
    AuthorOrder   SMALLINT UNSIGNED NOT NULL,
    AuthorRole    VARCHAR(80) DEFAULT 'Author',
    PRIMARY KEY (PaperID, ResearcherID),
    CONSTRAINT uq_paper_author_order UNIQUE (PaperID, AuthorOrder),
    CONSTRAINT fk_pa_paper
        FOREIGN KEY (PaperID) REFERENCES Papers(PaperID)
        ON DELETE CASCADE,
    CONSTRAINT fk_pa_researcher
        FOREIGN KEY (ResearcherID) REFERENCES Researchers(ResearcherID)
        ON DELETE CASCADE,
    CONSTRAINT chk_author_order CHECK (AuthorOrder > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Paper_Topics (
    PaperID  BIGINT UNSIGNED NOT NULL,
    TopicID  BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (PaperID, TopicID),
    CONSTRAINT fk_pt_paper
        FOREIGN KEY (PaperID) REFERENCES Papers(PaperID)
        ON DELETE CASCADE,
    CONSTRAINT fk_pt_topic
        FOREIGN KEY (TopicID) REFERENCES Topics(TopicID)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Citations (
    CitingPaperID  BIGINT UNSIGNED NOT NULL,
    CitedPaperID   BIGINT UNSIGNED NOT NULL,
    CitationDate   DATE,
    PRIMARY KEY (CitingPaperID, CitedPaperID),
    CONSTRAINT fk_citation_citing
        FOREIGN KEY (CitingPaperID) REFERENCES Papers(PaperID)
        ON DELETE CASCADE,
    CONSTRAINT fk_citation_cited
        FOREIGN KEY (CitedPaperID) REFERENCES Papers(PaperID)
        ON DELETE CASCADE,
    CONSTRAINT chk_no_self_citation CHECK (CitingPaperID <> CitedPaperID)
) ENGINE=InnoDB;

-- Optional collaboration feature: researchers can create research groups.
CREATE TABLE IF NOT EXISTS ResearchGroups (
    GroupID      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    GroupName    VARCHAR(180) NOT NULL,
    Description  TEXT,
    CreatedBy    BIGINT UNSIGNED,
    CreatedAt    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_group_creator
        FOREIGN KEY (CreatedBy) REFERENCES Researchers(ResearcherID)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS GroupMembers (
    GroupID       BIGINT UNSIGNED NOT NULL,
    ResearcherID  BIGINT UNSIGNED NOT NULL,
    MemberRole    ENUM('Owner', 'Member') NOT NULL DEFAULT 'Member',
    JoinedAt      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (GroupID, ResearcherID),
    CONSTRAINT fk_gm_group
        FOREIGN KEY (GroupID) REFERENCES ResearchGroups(GroupID)
        ON DELETE CASCADE,
    CONSTRAINT fk_gm_researcher
        FOREIGN KEY (ResearcherID) REFERENCES Researchers(ResearcherID)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 2. INDEXES
-- Unique constraints above already create indexes on Email,
-- ORCID, DOI, and TopicName. Do not create duplicate indexes.
-- ============================================================

CREATE INDEX idx_papers_year
    ON Papers(PublicationYear);

CREATE INDEX idx_papers_venue
    ON Papers(Venue);

CREATE INDEX idx_papers_citation_count
    ON Papers(CitationCount);

CREATE INDEX idx_papers_uploaded_by
    ON Papers(UploadedBy);

CREATE INDEX idx_paper_authors_researcher
    ON Paper_Authors(ResearcherID, PaperID);

CREATE INDEX idx_paper_topics_topic
    ON Paper_Topics(TopicID, PaperID);

CREATE INDEX idx_citations_cited
    ON Citations(CitedPaperID, CitingPaperID);

CREATE INDEX idx_researchers_area
    ON Researchers(ResearchArea);

CREATE INDEX idx_groups_created_by
    ON ResearchGroups(CreatedBy);

-- Full-text search index for paper title and abstract.
ALTER TABLE Papers
    ADD FULLTEXT INDEX ft_papers_title_abstract (Title, Abstract);

-- ============================================================
-- 3. VIEWS
-- ============================================================

CREATE OR REPLACE VIEW PaperOverview AS
SELECT
    p.PaperID,
    p.Title,
    p.Abstract,
    p.PublicationYear,
    p.DOI,
    p.Venue,
    p.CitationCount,
    p.PaperURL,
    GROUP_CONCAT(
        DISTINCT r.Name
        ORDER BY pa.AuthorOrder
        SEPARATOR ', '
    ) AS Authors,
    GROUP_CONCAT(
        DISTINCT t.TopicName
        ORDER BY t.TopicName
        SEPARATOR ', '
    ) AS Topics
FROM Papers p
LEFT JOIN Paper_Authors pa ON pa.PaperID = p.PaperID
LEFT JOIN Researchers r ON r.ResearcherID = pa.ResearcherID
LEFT JOIN Paper_Topics pt ON pt.PaperID = p.PaperID
LEFT JOIN Topics t ON t.TopicID = pt.TopicID
GROUP BY
    p.PaperID, p.Title, p.Abstract, p.PublicationYear,
    p.DOI, p.Venue, p.CitationCount, p.PaperURL;

CREATE OR REPLACE VIEW ResearcherPaperStats AS
SELECT
    r.ResearcherID,
    r.Name,
    r.Email,
    r.Affiliation,
    r.ResearchArea,
    COUNT(DISTINCT pa.PaperID) AS PublishedPaperCount,
    COALESCE(SUM(DISTINCT p.CitationCount), 0) AS TotalCitations
FROM Researchers r
LEFT JOIN Paper_Authors pa ON pa.ResearcherID = r.ResearcherID
LEFT JOIN Papers p ON p.PaperID = pa.PaperID
GROUP BY
    r.ResearcherID, r.Name, r.Email, r.Affiliation, r.ResearchArea;

-- ============================================================
-- 4. TRIGGERS
-- Keep Papers.CitationCount synchronized with Citations.
-- ============================================================

DROP TRIGGER IF EXISTS trg_citations_after_insert;
DROP TRIGGER IF EXISTS trg_citations_after_delete;
DROP TRIGGER IF EXISTS trg_citations_before_insert;

DELIMITER $$

CREATE TRIGGER trg_citations_before_insert
BEFORE INSERT ON Citations
FOR EACH ROW
BEGIN
    IF NEW.CitingPaperID = NEW.CitedPaperID THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'A paper cannot cite itself.';
    END IF;
END$$

CREATE TRIGGER trg_citations_after_insert
AFTER INSERT ON Citations
FOR EACH ROW
BEGIN
    UPDATE Papers
    SET CitationCount = CitationCount + 1
    WHERE PaperID = NEW.CitedPaperID;
END$$

CREATE TRIGGER trg_citations_after_delete
AFTER DELETE ON Citations
FOR EACH ROW
BEGIN
    UPDATE Papers
    SET CitationCount = GREATEST(CitationCount - 1, 0)
    WHERE PaperID = OLD.CitedPaperID;
END$$

DELIMITER ;

-- ============================================================
-- 5. STORED PROCEDURES
-- ============================================================

DROP PROCEDURE IF EXISTS sp_SearchPapers;
DROP PROCEDURE IF EXISTS sp_GetResearcherPapers;
DROP PROCEDURE IF EXISTS sp_AddPaperWithAuthor;

DELIMITER $$

-- Full-text paper search.
CREATE PROCEDURE sp_SearchPapers(IN p_SearchTerm VARCHAR(255))
BEGIN
    SELECT
        PaperID,
        Title,
        Abstract,
        PublicationYear,
        Venue,
        CitationCount,
        MATCH(Title, Abstract)
            AGAINST (p_SearchTerm IN NATURAL LANGUAGE MODE) AS RelevanceScore
    FROM Papers
    WHERE MATCH(Title, Abstract)
        AGAINST (p_SearchTerm IN NATURAL LANGUAGE MODE)
    ORDER BY RelevanceScore DESC, CitationCount DESC;
END$$

-- List all papers authored by a researcher.
CREATE PROCEDURE sp_GetResearcherPapers(IN p_ResearcherID BIGINT UNSIGNED)
BEGIN
    SELECT
        p.PaperID,
        p.Title,
        p.PublicationYear,
        p.Venue,
        p.CitationCount,
        pa.AuthorOrder
    FROM Paper_Authors pa
    INNER JOIN Papers p ON p.PaperID = pa.PaperID
    WHERE pa.ResearcherID = p_ResearcherID
    ORDER BY p.PublicationYear DESC, p.Title;
END$$

-- Insert a paper and its first author atomically.
CREATE PROCEDURE sp_AddPaperWithAuthor(
    IN p_Title VARCHAR(500),
    IN p_Abstract TEXT,
    IN p_Year YEAR,
    IN p_Venue VARCHAR(255),
    IN p_ResearcherID BIGINT UNSIGNED,
    OUT p_NewPaperID BIGINT UNSIGNED
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO Papers (Title, Abstract, PublicationYear, Venue, UploadedBy)
    VALUES (p_Title, p_Abstract, p_Year, p_Venue, p_ResearcherID);

    SET p_NewPaperID = LAST_INSERT_ID();

    INSERT INTO Paper_Authors (PaperID, ResearcherID, AuthorOrder)
    VALUES (p_NewPaperID, p_ResearcherID, 1);

    COMMIT;
END$$

DELIMITER ;

-- ============================================================
-- 6. DEMONSTRATION DATA
-- PasswordHash values below are placeholders for database
-- demonstrations only. The application must store real password
-- hashes generated by a secure password-hashing library.
-- ============================================================

INSERT INTO Researchers
    (Name, Email, PasswordHash, Affiliation, ResearchArea, Role)
VALUES
    ('Aarav Sharma', 'aarav.demo@researchhub.test', 'DEMO_HASH_REPLACE_ME',
     'PES University', 'Machine Learning', 'Researcher'),
    ('Diya Rao', 'diya.demo@researchhub.test', 'DEMO_HASH_REPLACE_ME',
     'PES University', 'Data Science', 'Student'),
    ('Kabir Mehta', 'kabir.demo@researchhub.test', 'DEMO_HASH_REPLACE_ME',
     'IISc Bengaluru', 'Natural Language Processing', 'Researcher')
ON DUPLICATE KEY UPDATE
    Name = VALUES(Name),
    Affiliation = VALUES(Affiliation),
    ResearchArea = VALUES(ResearchArea);

INSERT INTO Topics (TopicName, Description)
VALUES
    ('Machine Learning', 'Algorithms that learn patterns from data.'),
    ('Natural Language Processing', 'Computational methods for human language.'),
    ('Recommendation Systems', 'Methods for personalized ranking and recommendation.'),
    ('Data Mining', 'Discovering useful patterns in large datasets.')
ON DUPLICATE KEY UPDATE
    Description = VALUES(Description);

INSERT INTO Papers
    (Title, Abstract, PublicationYear, DOI, Venue, UploadedBy)
VALUES
    ('A Survey of Machine Learning Recommendation Methods',
     'A demonstration paper describing collaborative filtering and content-based recommendation methods.',
     2024, '10.5555/researchhub.demo.001', 'Journal of Research Systems', 1),
    ('Neural Methods for Scientific Text Retrieval',
     'A demonstration paper exploring neural representations for searching scientific publications.',
     2025, '10.5555/researchhub.demo.002', 'Conference on Applied AI', 3),
    ('Mining Research Trends from Academic Publications',
     'A demonstration paper about identifying emerging research topics from publication metadata.',
     2023, '10.5555/researchhub.demo.003', 'Data Analytics Review', 2)
ON DUPLICATE KEY UPDATE
    Title = VALUES(Title),
    Abstract = VALUES(Abstract),
    PublicationYear = VALUES(PublicationYear),
    Venue = VALUES(Venue);

-- Link authors. The researcher IDs are resolved using demo emails.
INSERT IGNORE INTO Paper_Authors (PaperID, ResearcherID, AuthorOrder)
SELECT p.PaperID, r.ResearcherID, 1
FROM Papers p
JOIN Researchers r ON r.Email = 'aarav.demo@researchhub.test'
WHERE p.DOI = '10.5555/researchhub.demo.001';

INSERT IGNORE INTO Paper_Authors (PaperID, ResearcherID, AuthorOrder)
SELECT p.PaperID, r.ResearcherID, 2
FROM Papers p
JOIN Researchers r ON r.Email = 'diya.demo@researchhub.test'
WHERE p.DOI = '10.5555/researchhub.demo.001';

INSERT IGNORE INTO Paper_Authors (PaperID, ResearcherID, AuthorOrder)
SELECT p.PaperID, r.ResearcherID, 1
FROM Papers p
JOIN Researchers r ON r.Email = 'kabir.demo@researchhub.test'
WHERE p.DOI = '10.5555/researchhub.demo.002';

INSERT IGNORE INTO Paper_Authors (PaperID, ResearcherID, AuthorOrder)
SELECT p.PaperID, r.ResearcherID, 1
FROM Papers p
JOIN Researchers r ON r.Email = 'diya.demo@researchhub.test'
WHERE p.DOI = '10.5555/researchhub.demo.003';

-- Assign topics to papers.
INSERT IGNORE INTO Paper_Topics (PaperID, TopicID)
SELECT p.PaperID, t.TopicID
FROM Papers p
JOIN Topics t ON t.TopicName IN ('Machine Learning', 'Recommendation Systems')
WHERE p.DOI = '10.5555/researchhub.demo.001';

INSERT IGNORE INTO Paper_Topics (PaperID, TopicID)
SELECT p.PaperID, t.TopicID
FROM Papers p
JOIN Topics t ON t.TopicName IN ('Natural Language Processing', 'Machine Learning')
WHERE p.DOI = '10.5555/researchhub.demo.002';

INSERT IGNORE INTO Paper_Topics (PaperID, TopicID)
SELECT p.PaperID, t.TopicID
FROM Papers p
JOIN Topics t ON t.TopicName IN ('Data Mining', 'Data Science')
WHERE p.DOI = '10.5555/researchhub.demo.003';

-- Demonstration citation: paper 2 cites paper 1.
SET @citing_id = (SELECT PaperID FROM Papers WHERE DOI = '10.5555/researchhub.demo.002' LIMIT 1);
SET @cited_id = (SELECT PaperID FROM Papers WHERE DOI = '10.5555/researchhub.demo.001' LIMIT 1);
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate)
SELECT @citing_id, @cited_id, CURRENT_DATE
WHERE @citing_id IS NOT NULL AND @cited_id IS NOT NULL;

-- ============================================================
-- 7. EXAMPLE QUERIES FOR DEMONSTRATION / TESTING
-- Run these separately when needed.
-- ============================================================

-- A. View papers with authors and topics:
-- SELECT * FROM PaperOverview;

-- B. View researcher publication statistics:
-- SELECT * FROM ResearcherPaperStats;

-- C. Search papers using the full-text index:
-- CALL sp_SearchPapers('machine learning');

-- D. Get a researcher's papers:
-- CALL sp_GetResearcherPapers(1);

-- E. Add a paper and its first author in one transaction:
-- SET @new_paper_id = 0;
-- CALL sp_AddPaperWithAuthor(
--     'Example Transactional Paper',
--     'An example paper inserted using a stored procedure.',
--     2026,
--     'ResearchHub Demo Venue',
--     1,
--     @new_paper_id
-- );
-- SELECT @new_paper_id AS NewPaperID;

-- F. Citation count is maintained by triggers:
-- SELECT PaperID, Title, CitationCount FROM Papers;

-- G. Topic-wise paper counts:
-- SELECT t.TopicName, COUNT(pt.PaperID) AS PaperCount
-- FROM Topics t
-- LEFT JOIN Paper_Topics pt ON pt.TopicID = t.TopicID
-- GROUP BY t.TopicID, t.TopicName
-- ORDER BY PaperCount DESC;

-- H. Researchers who have co-authored papers:
-- SELECT
--     r1.Name AS Researcher1,
--     r2.Name AS Researcher2,
--     COUNT(*) AS SharedPapers
-- FROM Paper_Authors a1
-- JOIN Paper_Authors a2
--   ON a1.PaperID = a2.PaperID
--  AND a1.ResearcherID < a2.ResearcherID
-- JOIN Researchers r1 ON r1.ResearcherID = a1.ResearcherID
-- JOIN Researchers r2 ON r2.ResearcherID = a2.ResearcherID
-- GROUP BY r1.ResearcherID, r1.Name, r2.ResearcherID, r2.Name
-- ORDER BY SharedPapers DESC;

-- ============================================================

-- ============================================================
-- EXPANDED DEMO SEED DATA (Papers 17 - 40, Citations, Authors)
-- ============================================================

-- Additional Prominent Researchers
INSERT INTO Researchers (ResearcherID, Name, Email, PasswordHash, Affiliation, ResearchArea, Role) VALUES
    (18, 'Dr. Yann LeCun', 'yann.lecun@meta.com', '$2b$12$KIXe8P7vYqL7K.uFh7oM.OVd5Y0k59D1VwVb7F.M0D6p6dY5VvXqO', 'Meta AI & NYU', 'Computer Vision, Deep Learning', 'Researcher'),
    (19, 'Dr. Christopher Manning', 'manning@stanford.edu', '$2b$12$KIXe8P7vYqL7K.uFh7oM.OVd5Y0k59D1VwVb7F.M0D6p6dY5VvXqO', 'Stanford University', 'Natural Language Processing', 'Researcher'),
    (20, 'Dr. Matei Zaharia', 'matei@cs.stanford.edu', '$2b$12$KIXe8P7vYqL7K.uFh7oM.OVd5Y0k59D1VwVb7F.M0D6p6dY5VvXqO', 'Stanford & Databricks', 'Distributed Systems, Data Processing', 'Researcher'),
    (21, 'Dr. Tri Dao', 'tridao@cs.princeton.edu', '$2b$12$KIXe8P7vYqL7K.uFh7oM.OVd5Y0k59D1VwVb7F.M0D6p6dY5VvXqO', 'Princeton University', 'Deep Learning Systems, IO-Aware Algorithms', 'Researcher'),
    (22, 'Dr. Tim Dettmers', 'dettmers@cs.washington.edu', '$2b$12$KIXe8P7vYqL7K.uFh7oM.OVd5Y0k59D1VwVb7F.M0D6p6dY5VvXqO', 'University of Washington', 'Efficient Deep Learning, Quantization', 'Researcher'),
    (23, 'Dr. Dawn Song', 'dawnsong@berkeley.edu', '$2b$12$KIXe8P7vYqL7K.uFh7oM.OVd5Y0k59D1VwVb7F.M0D6p6dY5VvXqO', 'UC Berkeley', 'AI Security, Privacy, Blockchain', 'Researcher')
ON DUPLICATE KEY UPDATE Affiliation=VALUES(Affiliation);

-- Expanded Real-World Research Papers
INSERT INTO Papers (PaperID, Title, Abstract, PublicationYear, DOI, Venue, PublicationDate) VALUES
    (17, 'Language Models are Few-Shot Learners (GPT-3)', 'We demonstrate that scaling up language models greatly improves task-agnostic, few-shot performance, sometimes even reaching competitiveness with prior state-of-the-art fine-tuning approaches. We train GPT-3, an autoregressive language model with 175 billion parameters, and test its performance in the few-shot setting across hundreds of diverse benchmarks.', 2020, '10.48550/arXiv.2005.14165', 'NeurIPS Conference on Neural Information Processing Systems', '2020-05-28'),
    (18, 'LLaMA: Open and Efficient Foundation Language Models', 'We introduce LLaMA, a collection of foundation language models ranging from 7B to 65B parameters. We train our models on trillions of tokens, showing that state-of-the-art models can be trained exclusively on publicly available datasets without relying on proprietary repositories.', 2023, '10.48550/arXiv.2302.13971', 'Meta AI Technical Report', '2023-02-27'),
    (19, 'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning', 'We introduce DeepSeek-R1-Zero and DeepSeek-R1, large language models trained with large-scale reinforcement learning without supervised fine-tuning as a precursor. DeepSeek-R1 naturally demonstrates remarkable reasoning abilities including self-verification, reflection, and generating long chains of thought.', 2025, '10.48550/arXiv.2501.12948', 'International Conference on Learning Representations (ICLR)', '2025-01-22'),
    (20, 'LoRA: Low-Rank Adaptation of Large Language Models', 'An important paradigm of natural language processing involves large-scale pre-training on general domain data and adaptation to specific tasks. We propose Low-Rank Adaptation (LoRA), which freezes pre-trained model weights and injects trainable rank decomposition matrices into each transformer layer, reducing trainable parameters by 10,000x.', 2022, '10.48550/arXiv.2106.09685', 'International Conference on Learning Representations (ICLR)', '2022-04-25'),
    (21, 'Direct Preference Optimization: Your Language Model is Secretly a Reward Model', 'While RLHF is a powerful paradigm, it is complex and often unstable, requiring fitting a reward model followed by RL policy optimization. We propose Direct Preference Optimization (DPO), an algorithm that implicitly optimizes the same objective as RLHF via a simple binary cross-entropy loss, yielding stable and mathematically exact alignment.', 2023, '10.48550/arXiv.2305.18290', 'NeurIPS Conference on Neural Information Processing Systems', '2023-05-29'),
    (22, 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness', 'Transformers are slow and memory-intensive on long sequences, as the self-attention mechanism scales quadratically with sequence length. We propose FlashAttention, an IO-aware exact attention algorithm that uses tiling to reduce the number of memory reads/writes between GPU HBM and on-chip SRAM, achieving 2-4x wall-clock speedups.', 2022, '10.48550/arXiv.2205.14135', 'NeurIPS Conference on Neural Information Processing Systems', '2022-06-23'),
    (23, 'FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning', 'FlashAttention revolutionized transformer throughput by optimizing memory IO. We introduce FlashAttention-2, which improves work partitioning across thread blocks, optimizes matrix multiplications, and distributes sequence length across warp level execution, achieving up to 73% theoretical peak GPU utilization.', 2024, '10.48550/arXiv.2307.08691', 'International Conference on Learning Representations (ICLR)', '2024-01-15'),
    (24, 'Spanner: Google''s Globally Distributed Database', 'Spanner is Google''s scalable, multi-version, globally distributed, and synchronously replicated database. It is the first system to distribute data at global scale and support externally consistent distributed transactions using TrueTime API synchronized with GPS and atomic clocks.', 2023, '10.1145/2491245', 'ACM Transactions on Computer Systems (TOCS)', '2023-03-10'),
    (25, 'ResNet-v2: Identity Mappings in Deep Residual Networks', 'Deep residual networks have emerged as a family of extremely deep architectures showing compelling accuracy. We analyze the propagation formulation behind residual building blocks and demonstrate that identity mapping shortcut connections yield pristine forward and backward signal propagation, enabling training of 1000-layer networks.', 2022, '10.1007/978-3-319-46493-0_38', 'European Conference on Computer Vision (ECCV)', '2022-09-12'),
    (26, 'Learning Transferable Visual Models From Natural Language Supervision (CLIP)', 'State-of-the-art vision systems are trained to predict a fixed set of predetermined object categories. We demonstrate that the simple pre-training task of predicting which caption goes with which image is an efficient and scalable way to learn high-quality image representations from scratch on 400M image-text pairs.', 2021, '10.48550/arXiv.2103.00020', 'International Conference on Machine Learning (ICML)', '2021-02-26'),
    (27, 'Segment Anything: Foundational Models for Computer Vision', 'We present the Segment Anything project: a new task, model, and dataset for image segmentation. Using our efficient model in a data collection loop, we built the largest segmentation dataset to date (over 1 billion masks on 11 million licensed images). The model enables zero-shot transfer to novel image distributions.', 2023, '10.48550/arXiv.2304.02643', 'IEEE/CVF International Conference on Computer Vision (ICCV)', '2023-04-05'),
    (28, 'High-Resolution Image Synthesis with Latent Diffusion Models', 'By breaking the image formation process down into sequential denoising autoencoders, diffusion models achieve state-of-the-art synthesis results on image data. To enable diffusion training on limited computational resources without compromising quality, we apply them in the latent space of powerful pre-trained autoencoders.', 2022, '10.1109/CVPR52688.2022.01042', 'IEEE/CVF Conference on Computer Vision and Pattern Recognition', '2022-06-19'),
    (29, 'Semi-Supervised Classification with Graph Convolutional Networks (GCN)', 'We present a scalable approach for semi-supervised learning on graph-structured data based on an efficient variant of convolutional neural networks which operate directly on graphs. Our model scales linearly in the number of graph edges and learns hidden layer representations encoding both local graph structure and node features.', 2021, '10.48550/arXiv.1609.02907', 'International Conference on Learning Representations (ICLR)', '2021-04-18'),
    (30, 'Inductive Representation Learning on Large Graphs (GraphSAGE)', 'Low-dimensional embeddings of nodes in large graphs have proven extremely useful as feature inputs for a wide variety of prediction and graph analysis tasks. We propose GraphSAGE, an inductive framework that leverages node attribute information to efficiently generate representations for previously unseen nodes by sampling and aggregating features from local neighborhoods.', 2022, '10.48550/arXiv.1706.02216', 'NeurIPS Conference on Neural Information Processing Systems', '2022-12-05'),
    (31, 'Fast Graph Representation Learning with PyTorch Geometric', 'We introduce PyTorch Geometric (PyG), a library for deep learning on irregular input data such as graphs, point clouds, and manifolds. PyG provides fast graph convolutions leveraging dedicated CUDA kernels and sparse matrix multiplication primitives.', 2023, '10.48550/arXiv.1903.02428', 'International Conference on Learning Representations (ICLR)', '2023-05-02'),
    (32, 'Faiss: A Library for Efficient Similarity Search and Dense Clustering', 'Similarity search on billion-scale dense vector collections requires algorithms that trade off query time, memory footprint, and recall precision. We present Faiss, an open-source library that provides optimized GPU and CPU implementations for product quantization, inverted file indexes, and exact vector searches.', 2021, '10.1109/TBDATA.2019.2921572', 'IEEE Transactions on Big Data', '2021-03-01'),
    (33, 'HNSW: Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs', 'We present the Hierarchical Navigable Small World (HNSW) graphs, an algorithm for approximate nearest neighbor search that organizes nodes into a multi-layer hierarchical graph structure. HNSW achieves logarithmic scaling, high recall, and superior query throughput compared to tree-based and KD-tree approaches.', 2022, '10.1109/TPAMI.2018.2889473', 'IEEE Transactions on Pattern Analysis and Machine Intelligence', '2022-02-15'),
    (34, 'Snowflake: The Architecture of an Elastic Data Warehouse', 'Snowflake is a multi-tenant, transactional, ACID-compliant cloud data warehouse. We detail its novel multi-cluster shared-data architecture that separates storage from compute, enabling independent scaling, virtual warehouses, and continuous transaction guarantees with zero management overhead.', 2023, '10.1145/2882903.2903741', 'ACM SIGMOD International Conference on Management of Data', '2023-06-18'),
    (35, 'DuckDB: An Embeddable Analytical Database for In-Process OLAP', 'DuckDB is an in-process SQL OLAP database management system designed to support analytical queries. We describe its vectorized execution engine, zero-copy Apache Arrow integration, and pipelined execution that delivers enterprise-grade analytical speeds inside native Python and R runtimes.', 2023, '10.14778/3342263.3342644', 'VLDB International Conference on Very Large Data Bases', '2023-08-25'),
    (36, 'TAO: Facebook’s Distributed Data Store for the Social Graph', 'Managing social graph relationships requires high read throughput, real-time consistency, and global scale. We present TAO, a geographically distributed data store with an object-and-association data model that serves over a billion queries per second using write-through caching and eventual consistency.', 2022, '10.5555/2535461.2535468', 'USENIX Annual Technical Conference (ATC)', '2022-07-11'),
    (37, 'Spectre Attacks: Exploiting Speculative Execution in Hardware', 'Modern processors use speculative execution to maximize performance. We demonstrate Spectre attacks, which involve inducing a victim program to speculatively perform operations that would not occur during correct program execution, thereby leaking sensitive information across security boundaries via hardware side channels.', 2022, '10.1109/SP.2019.00002', 'IEEE Symposium on Security and Privacy (S&P)', '2022-05-20'),
    (38, 'SoK: Decentralized Finance (DeFi) Security and Privacy Paradigms', 'Decentralized Finance (DeFi) protocols have created an open financial ecosystem controlling billions of dollars in digital assets. We systematize DeFi security vulnerabilities, including reentrancy, oracle manipulation, frontrunning, and sandwich attacks, and examine formal verification defenses.', 2023, '10.1109/SP46215.2023.10179313', 'IEEE Symposium on Security and Privacy (S&P)', '2023-05-22'),
    (39, 'Fault-Tolerant Quantum Computation with Surface Codes', 'Realizing practical quantum computing requires fault tolerance against environmental decoherence and gate noise. We review 2D surface codes, detailing error detection, stabilizer measurements, and topological braided defect operations that achieve quantum threshold error rates exceeding 1%.', 2022, '10.1103/PhysRevA.86.032324', 'Physical Review A', '2022-11-14'),
    (40, 'Quantum Supremacy Using a Programmable Superconducting Processor', 'The promise of quantum computers is that certain computational tasks might be executed exponentially faster on a quantum processor than on a classical computer. We report the achievement of quantum supremacy using a programmable superconducting Sycamore processor to sample pseudo-random quantum circuits in 200 seconds.', 2021, '10.1038/s41586-019-1666-5', 'Nature International Journal of Science', '2021-10-23')
ON DUPLICATE KEY UPDATE Title=VALUES(Title);

-- Paper Topics
INSERT IGNORE INTO Paper_Topics (PaperID, TopicID) VALUES
    (17, 1),
    (17, 2),
    (17, 9),
    (18, 1),
    (18, 9),
    (19, 1),
    (19, 9),
    (19, 16),
    (20, 1),
    (20, 9),
    (21, 9),
    (21, 16),
    (22, 1),
    (22, 13),
    (23, 1),
    (23, 13),
    (24, 12),
    (24, 13),
    (25, 1),
    (25, 10),
    (26, 1),
    (26, 9),
    (26, 10),
    (27, 1),
    (27, 10),
    (28, 1),
    (28, 10),
    (29, 1),
    (29, 11),
    (30, 4),
    (30, 11),
    (31, 1),
    (31, 11),
    (32, 4),
    (32, 12),
    (33, 11),
    (33, 12),
    (34, 12),
    (34, 13),
    (35, 12),
    (36, 12),
    (36, 13),
    (37, 15),
    (38, 15),
    (39, 14),
    (40, 14);

-- Paper Authors
INSERT IGNORE INTO Paper_Authors (PaperID, ResearcherID, AuthorOrder, AuthorRole) VALUES
    (17, 14, 1, 'Primary Author'),
    (17, 19, 2, 'Co-Author'),
    (18, 14, 2, 'Co-Author'),
    (18, 18, 1, 'Primary Author'),
    (19, 5, 2, 'Co-Author'),
    (19, 14, 1, 'Primary Author'),
    (20, 15, 1, 'Primary Author'),
    (20, 22, 2, 'Co-Author'),
    (21, 2, 2, 'Co-Author'),
    (21, 19, 1, 'Primary Author'),
    (22, 20, 2, 'Co-Author'),
    (22, 21, 1, 'Primary Author'),
    (23, 13, 2, 'Co-Author'),
    (23, 21, 1, 'Primary Author'),
    (24, 12, 1, 'Primary Author'),
    (24, 17, 2, 'Co-Author'),
    (25, 16, 2, 'Co-Author'),
    (25, 18, 1, 'Primary Author'),
    (26, 15, 2, 'Co-Author'),
    (26, 18, 1, 'Primary Author'),
    (27, 6, 2, 'Co-Author'),
    (27, 18, 1, 'Primary Author'),
    (28, 14, 2, 'Co-Author'),
    (28, 15, 1, 'Primary Author'),
    (29, 3, 2, 'Co-Author'),
    (29, 13, 1, 'Primary Author'),
    (30, 12, 2, 'Co-Author'),
    (30, 13, 1, 'Primary Author'),
    (31, 3, 1, 'Primary Author'),
    (31, 16, 2, 'Co-Author'),
    (32, 12, 1, 'Primary Author'),
    (32, 17, 2, 'Co-Author'),
    (33, 5, 2, 'Co-Author'),
    (33, 17, 1, 'Primary Author'),
    (34, 12, 2, 'Co-Author'),
    (34, 20, 1, 'Primary Author'),
    (35, 6, 2, 'Co-Author'),
    (35, 12, 1, 'Primary Author'),
    (36, 17, 1, 'Primary Author'),
    (36, 20, 2, 'Co-Author'),
    (37, 15, 2, 'Co-Author'),
    (37, 23, 1, 'Primary Author'),
    (38, 5, 2, 'Co-Author'),
    (38, 23, 1, 'Primary Author'),
    (39, 13, 2, 'Co-Author'),
    (39, 16, 1, 'Primary Author'),
    (40, 14, 2, 'Co-Author'),
    (40, 16, 1, 'Primary Author');

-- Expanded Citation Network
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (16, 20, '2025-02-01');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (17, 5, '2020-06-15');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (18, 5, '2023-03-01');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (18, 17, '2023-03-05');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (19, 5, '2025-01-25');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (19, 18, '2025-01-26');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (19, 21, '2025-01-28');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (20, 5, '2022-05-10');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (20, 17, '2022-05-12');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (21, 5, '2023-06-12');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (21, 17, '2023-06-10');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (22, 5, '2022-07-01');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (23, 5, '2024-02-05');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (23, 22, '2024-02-01');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (24, 11, '2023-04-10');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (25, 9, '2022-10-01');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (26, 5, '2021-03-20');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (26, 9, '2021-03-15');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (27, 9, '2023-04-15');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (27, 26, '2023-04-12');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (28, 5, '2022-07-05');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (28, 9, '2022-07-01');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (29, 4, '2021-05-10');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (30, 7, '2023-01-15');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (30, 29, '2022-12-10');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (31, 29, '2023-05-15');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (31, 30, '2023-05-20');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (32, 8, '2021-03-20');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (33, 8, '2022-03-05');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (33, 32, '2022-03-01');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (34, 11, '2023-07-01');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (35, 11, '2023-09-05');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (35, 34, '2023-09-01');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (36, 11, '2022-08-15');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (36, 24, '2022-08-10');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (37, 13, '2022-06-01');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (38, 37, '2023-06-01');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (39, 14, '2022-12-01');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (40, 14, '2021-11-01');
INSERT IGNORE INTO Citations (CitingPaperID, CitedPaperID, CitationDate) VALUES (40, 39, '2022-12-15');

-- END OF RESEARCHHUB DATABASE SCRIPT
-- ============================================================
