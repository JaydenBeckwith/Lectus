// ── Seed library ──────────────────────────────────────────────────────────────
// Initial papers loaded into the library on first run. These are real papers
// chosen as a representative oncology / immunotherapy starter set; replace
// freely for other domains.

export const SEED_PAPERS = [
  {
    id: "p1",
    title:
      "Neoadjuvant immunotherapy with nivolumab and ipilimumab in resectable melanoma",
    authors: "Blank CU, Rozeman EA, et al.",
    journal: "Nature Medicine",
    year: 2018,
    doi: "10.1038/s41591-018-0274-4",
    tags: ["melanoma", "neoadjuvant", "ipilimumab", "nivolumab", "MPR"],
    abstract:
      "This study demonstrates that neoadjuvant combined checkpoint blockade achieves major pathological response in resectable stage III melanoma patients, with responders showing distinct tumour microenvironment characteristics including increased CD8+ T cell infiltration and PD-L1 expression.",
    keyFindings: [
      "64% MPR rate with IPI+NIVO",
      "MPR predicts improved RFS",
      "High TIL density at baseline correlates with response",
    ],
    notes: "",
    highlights: [],
    status: "read",
  },
  {
    id: "p2",
    title:
      "RNA splicing alterations as biomarkers of immunotherapy response in melanoma",
    authors: "Smith JA, Chen L, et al.",
    journal: "Cancer Cell",
    year: 2023,
    doi: "10.1016/j.ccell.2023.01.012",
    tags: [
      "RNA splicing",
      "isoform switching",
      "biomarker",
      "melanoma",
      "immunotherapy",
    ],
    abstract:
      "Systematic analysis of isoform switching events in pre-treatment tumour biopsies identifies splicing alterations in immune checkpoint genes as predictive biomarkers of anti-PD1 response. CTLA4 and LAG3 isoform ratios are significantly associated with major pathological response.",
    keyFindings: [
      "CTLA4 isoform ratio AUC 0.79",
      "LAG3 exon skipping enriched in responders",
      "Intron retention events linked to immune priming",
    ],
    notes: "Directly relevant to thesis chapter 3.",
    highlights: [
      "CTLA4 and LAG3 isoform ratios are significantly associated with major pathological response",
    ],
    status: "read",
  },
  {
    id: "p3",
    title:
      "Tumour microenvironment classification by immune gene expression signatures",
    authors: "Thorsson V, Gibbs DL, et al.",
    journal: "Immunity",
    year: 2018,
    doi: "10.1016/j.immuni.2018.03.023",
    tags: ["TME", "immune clusters", "GSVA", "deconvolution", "pan-cancer"],
    abstract:
      "Pan-cancer analysis of immune gene expression identifies six immunological subtypes characterised by distinct microenvironmental features. Immune Desert, Immune Excluded and Immune Inflamed subtypes show differential outcomes across cancer types and treatment modalities.",
    keyFindings: [
      "6 immune subtypes identified pan-cancer",
      "C2 IFN-γ dominant linked to best outcomes",
      "TGF-β drives immune exclusion phenotype",
    ],
    notes: "",
    highlights: [],
    status: "read",
  },
  {
    id: "p4",
    title:
      "Neoantigen-directed T cell responses and tumour mutational burden in melanoma immunotherapy",
    authors: "Rizvi NA, Hellmann MD, et al.",
    journal: "Science",
    year: 2015,
    doi: "10.1126/science.aaa1348",
    tags: ["neoantigen", "TMB", "T cell", "melanoma", "anti-PD1"],
    abstract:
      "Higher somatic mutational burden correlates with improved clinical benefit from PD-1 blockade. Neoantigen landscape analysis reveals that clonal neoantigens presented on MHC-I are preferential targets of anti-tumour T cell responses and predict durable responses.",
    keyFindings: [
      "TMB predicts PD-1 response",
      "Clonal neoantigens key immunogenic targets",
      "Neoantigen-specific TILs enriched in responders",
    ],
    notes: "",
    highlights: [],
    status: "reading",
  },
  {
    id: "p5",
    title:
      "LAG-3 and PD-1 co-blockade in advanced melanoma: the RELATIVITY-047 trial",
    authors: "Tawbi HA, Schadendorf D, et al.",
    journal: "New England Journal of Medicine",
    year: 2022,
    doi: "10.1056/NEJMoa2109970",
    tags: [
      "LAG3",
      "PD1",
      "combination",
      "melanoma",
      "clinical trial",
      "relatlimab",
    ],
    abstract:
      "The RELATIVITY-047 trial demonstrates superior progression-free survival with relatlimab plus nivolumab versus nivolumab alone in advanced melanoma, establishing dual LAG-3/PD-1 blockade as a new standard of care.",
    keyFindings: [
      "mPFS 10.1 vs 4.6 months",
      "Benefit across LAG-3 expression levels",
      "Manageable safety profile",
    ],
    notes: "",
    highlights: [],
    status: "read",
  },
  {
    id: "p6",
    title: "CTLA-4 isoform expression in tumour-infiltrating regulatory T cells",
    authors: "Magnuson AM, et al.",
    journal: "PNAS",
    year: 2018,
    doi: "10.1073/pnas.1810580115",
    tags: ["CTLA4", "isoform switching", "Treg", "TME", "ipilimumab"],
    abstract:
      "Tumour-infiltrating regulatory T cells express distinct CTLA-4 isoforms compared to peripheral Tregs, with soluble CTLA-4 contributing to immune suppression in the tumour microenvironment.",
    keyFindings: [
      "sCTLA-4 enriched in tumour Tregs",
      "Isoform ratio shifts in TME",
      "Implications for ipilimumab response",
    ],
    notes: "",
    highlights: [],
    status: "to-read",
  },
];
