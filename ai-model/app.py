"""
Clinica-Diff Advanced AI Engine v2.0
=====================================
- 60+ disease knowledge base
- Multi-strategy OCR preprocessing
- Base64 image support
- Advanced symptom NLP
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import re, os, json, base64, io
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# 1) DISEASE-SYMPTOM KNOWLEDGE BASE — 60 diseases
# ---------------------------------------------------------------------------
DISEASE_DB = {
    "Influenza (Flu)": {"symptoms": ["fever","chills","body ache","fatigue","cough","sore throat","runny nose","headache","muscle pain"], "severity": "moderate"},
    "Common Cold": {"symptoms": ["runny nose","sneezing","mild cough","sore throat","congestion","low grade fever"], "severity": "mild"},
    "COVID-19": {"symptoms": ["fever","dry cough","fatigue","loss of taste","loss of smell","shortness of breath","body ache","sore throat"], "severity": "high"},
    "Migraine": {"symptoms": ["severe headache","headache","nausea","sensitivity to light","blurred vision","vomiting","aura"], "severity": "moderate"},
    "Typhoid Fever": {"symptoms": ["high fever","fever","weakness","stomach pain","headache","diarrhea","loss of appetite","constipation"], "severity": "high"},
    "Dengue Fever": {"symptoms": ["high fever","fever","severe headache","pain behind eyes","joint pain","muscle pain","rash","fatigue","bleeding gums"], "severity": "high"},
    "Malaria": {"symptoms": ["fever","chills","sweating","headache","nausea","vomiting","muscle pain","fatigue","anemia"], "severity": "high"},
    "Gastroenteritis": {"symptoms": ["diarrhea","vomiting","nausea","stomach cramps","fever","dehydration","bloating"], "severity": "moderate"},
    "Pneumonia": {"symptoms": ["cough","fever","shortness of breath","chest pain","fatigue","chills","difficulty breathing","phlegm"], "severity": "high"},
    "Bronchitis": {"symptoms": ["persistent cough","cough","mucus production","fatigue","shortness of breath","chest discomfort","wheezing"], "severity": "moderate"},
    "Urinary Tract Infection": {"symptoms": ["burning urination","frequent urination","pelvic pain","cloudy urine","strong urine odor","fever","blood in urine"], "severity": "moderate"},
    "Hypertension": {"symptoms": ["headache","dizziness","blurred vision","chest pain","shortness of breath","nosebleed","anxiety"], "severity": "high"},
    "Diabetes (Type 2)": {"symptoms": ["frequent urination","increased thirst","fatigue","blurred vision","slow healing wounds","weight loss","numbness in hands"], "severity": "high"},
    "Allergic Rhinitis": {"symptoms": ["sneezing","runny nose","itchy eyes","congestion","watery eyes","postnasal drip"], "severity": "mild"},
    "Anemia": {"symptoms": ["fatigue","weakness","pale skin","shortness of breath","dizziness","cold hands","headache","brittle nails"], "severity": "moderate"},
    "Asthma": {"symptoms": ["wheezing","shortness of breath","chest tightness","cough","difficulty breathing","cough at night"], "severity": "moderate"},
    "Tuberculosis": {"symptoms": ["persistent cough","coughing blood","night sweats","weight loss","fever","fatigue","chest pain","loss of appetite"], "severity": "high"},
    "Hepatitis A": {"symptoms": ["fatigue","nausea","stomach pain","loss of appetite","low grade fever","dark urine","jaundice","joint pain"], "severity": "high"},
    "Hepatitis B": {"symptoms": ["fatigue","stomach pain","loss of appetite","nausea","vomiting","jaundice","dark urine","joint pain","fever"], "severity": "high"},
    "Chickenpox": {"symptoms": ["rash","blisters","fever","fatigue","headache","loss of appetite","itching"], "severity": "moderate"},
    "Measles": {"symptoms": ["high fever","cough","runny nose","red eyes","rash","sensitivity to light","white spots in mouth"], "severity": "high"},
    "Mumps": {"symptoms": ["swollen salivary glands","fever","headache","muscle pain","fatigue","loss of appetite","pain while chewing"], "severity": "moderate"},
    "Rubella": {"symptoms": ["rash","low grade fever","headache","red eyes","swollen lymph nodes","joint pain","runny nose"], "severity": "moderate"},
    "Whooping Cough": {"symptoms": ["severe cough","cough","vomiting after cough","fatigue","runny nose","fever","difficulty breathing"], "severity": "high"},
    "Sinusitis": {"symptoms": ["facial pain","congestion","runny nose","headache","cough","sore throat","fever","postnasal drip","reduced smell"], "severity": "moderate"},
    "Tonsillitis": {"symptoms": ["sore throat","difficulty swallowing","fever","swollen tonsils","headache","stiff neck","bad breath"], "severity": "moderate"},
    "Appendicitis": {"symptoms": ["stomach pain","nausea","vomiting","fever","loss of appetite","abdominal tenderness","constipation"], "severity": "critical"},
    "Kidney Stones": {"symptoms": ["severe pain","back pain","blood in urine","nausea","vomiting","frequent urination","burning urination","fever"], "severity": "high"},
    "Gallstones": {"symptoms": ["stomach pain","nausea","vomiting","fever","jaundice","back pain","bloating","indigestion"], "severity": "high"},
    "Peptic Ulcer": {"symptoms": ["stomach pain","bloating","nausea","vomiting","heartburn","loss of appetite","weight loss","blood in stool"], "severity": "moderate"},
    "GERD": {"symptoms": ["heartburn","chest pain","difficulty swallowing","regurgitation","sore throat","cough","nausea"], "severity": "moderate"},
    "Irritable Bowel Syndrome": {"symptoms": ["stomach cramps","bloating","diarrhea","constipation","gas","mucus in stool","stomach pain"], "severity": "moderate"},
    "Celiac Disease": {"symptoms": ["diarrhea","bloating","fatigue","weight loss","anemia","bone pain","rash","joint pain"], "severity": "moderate"},
    "Crohn's Disease": {"symptoms": ["diarrhea","stomach pain","fatigue","weight loss","blood in stool","fever","loss of appetite","mouth sores"], "severity": "high"},
    "Rheumatoid Arthritis": {"symptoms": ["joint pain","joint swelling","stiffness","fatigue","fever","loss of appetite","dry eyes"], "severity": "high"},
    "Osteoarthritis": {"symptoms": ["joint pain","stiffness","swelling","reduced flexibility","bone spurs","grinding sensation"], "severity": "moderate"},
    "Gout": {"symptoms": ["severe joint pain","joint swelling","redness","warmth in joint","limited range of motion","fever"], "severity": "moderate"},
    "Lupus": {"symptoms": ["fatigue","joint pain","rash","fever","hair loss","sensitivity to light","mouth sores","chest pain","swollen lymph nodes"], "severity": "high"},
    "Psoriasis": {"symptoms": ["red patches on skin","dry skin","itching","burning skin","thick nails","stiff joints","silvery scales"], "severity": "moderate"},
    "Eczema": {"symptoms": ["itching","dry skin","red patches on skin","swelling","cracked skin","oozing","thickened skin"], "severity": "mild"},
    "Scabies": {"symptoms": ["intense itching","rash","blisters","sores","itching at night","thin lines on skin"], "severity": "mild"},
    "Ringworm": {"symptoms": ["ring shaped rash","itching","red patches on skin","scaly skin","hair loss","cracked skin"], "severity": "mild"},
    "Conjunctivitis": {"symptoms": ["red eyes","itchy eyes","watery eyes","discharge from eyes","swollen eyelids","sensitivity to light","gritty feeling"], "severity": "mild"},
    "Glaucoma": {"symptoms": ["blurred vision","eye pain","headache","nausea","vomiting","halos around lights","tunnel vision"], "severity": "high"},
    "Cataracts": {"symptoms": ["blurred vision","faded colors","glare sensitivity","difficulty seeing at night","double vision","frequent prescription changes"], "severity": "moderate"},
    "Vertigo": {"symptoms": ["dizziness","spinning sensation","nausea","vomiting","balance problems","headache","ringing in ears"], "severity": "moderate"},
    "Meningitis": {"symptoms": ["severe headache","stiff neck","high fever","nausea","vomiting","sensitivity to light","confusion","rash","seizures"], "severity": "critical"},
    "Encephalitis": {"symptoms": ["headache","fever","confusion","seizures","difficulty speaking","weakness","stiff neck","hallucinations"], "severity": "critical"},
    "Stroke": {"symptoms": ["sudden numbness","confusion","difficulty speaking","blurred vision","severe headache","dizziness","loss of balance","facial drooping"], "severity": "critical"},
    "Heart Attack": {"symptoms": ["chest pain","shortness of breath","cold sweats","nausea","dizziness","pain in left arm","jaw pain","fatigue"], "severity": "critical"},
    "Angina": {"symptoms": ["chest pain","shortness of breath","fatigue","dizziness","nausea","sweating","pain in arm"], "severity": "high"},
    "Deep Vein Thrombosis": {"symptoms": ["leg pain","swelling","warmth in leg","red skin on leg","cramping","tenderness"], "severity": "high"},
    "Hypothyroidism": {"symptoms": ["fatigue","weight gain","cold sensitivity","constipation","dry skin","hair loss","depression","muscle weakness","joint pain"], "severity": "moderate"},
    "Hyperthyroidism": {"symptoms": ["weight loss","rapid heartbeat","anxiety","tremor","sweating","fatigue","difficulty sleeping","frequent bowel movements"], "severity": "moderate"},
    "PCOS": {"symptoms": ["irregular periods","weight gain","acne","hair loss","excess hair growth","fatigue","mood changes","pelvic pain"], "severity": "moderate"},
    "Endometriosis": {"symptoms": ["pelvic pain","painful periods","heavy periods","pain during intercourse","fatigue","diarrhea","constipation","nausea"], "severity": "moderate"},
    "Pancreatitis": {"symptoms": ["severe stomach pain","nausea","vomiting","fever","rapid pulse","tenderness","back pain","weight loss"], "severity": "high"},
    "Cholera": {"symptoms": ["severe diarrhea","dehydration","vomiting","muscle cramps","low blood pressure","rapid heart rate","thirst"], "severity": "critical"},
    "Jaundice": {"symptoms": ["yellow skin","yellow eyes","dark urine","pale stool","itching","fatigue","stomach pain","fever","weight loss"], "severity": "high"},
    "Leptospirosis": {"symptoms": ["high fever","headache","muscle pain","chills","red eyes","stomach pain","jaundice","rash","vomiting"], "severity": "high"},
    "Chikungunya": {"symptoms": ["fever","joint pain","rash","headache","muscle pain","joint swelling","fatigue","nausea"], "severity": "moderate"},
}

# ---------------------------------------------------------------------------
# 1.1) DRUG-DRUG INTERACTION (DDI) KNOWLEDGE BASE
# ---------------------------------------------------------------------------
# Format: { "Drug A": { "Interacts With": "Reason/Severity" } }
DDI_DB = {
    "Aspirin": {
        "Warfarin": "CRITICAL: High risk of internal bleeding. Both are blood thinners.",
        "Ibuprofen": "MODERATE: May decrease the effectiveness of Aspirin for heart protection.",
        "Clopidogrel": "HIGH: Increased risk of serious stomach bleeding."
    },
    "Warfarin": {
        "Aspirin": "CRITICAL: Severe risk of hemorrhage.",
        "Diclofenac": "HIGH: Increased risk of bleeding.",
        "Naproxen": "HIGH: Increased risk of bleeding."
    },
    "Metformin": {
        "Cimetidine": "MODERATE: May increase Metformin levels in blood.",
        "Contrast Dye": "CRITICAL: Risk of lactic acidosis. Stop Metformin 48h before CT scans."
    },
    "Atorvastatin": {
        "Clarithromycin": "HIGH: Risk of muscle breakdown (Rhabdomyolysis).",
        "Amiodarone": "MODERATE: Increases statin levels, risk of muscle pain."
    },
    "Omeprazole": {
        "Clopidogrel": "HIGH: Omeprazole reduces the anti-clotting effect of Clopidogrel.",
        "Iron Supplements": "MODERATE: Reduces iron absorption."
    },
    "Sildenafil": {
        "Nitroglycerin": "CRITICAL: Fatal drop in blood pressure. Never combine.",
        "Isosorbide": "CRITICAL: Dangerous drop in blood pressure."
    },
    "Lisinopril": {
        "Spironolactone": "HIGH: Risk of dangerously high potassium levels.",
        "Potassium Supplements": "HIGH: Risk of hyperkalemia."
    },
    "Amoxicillin": {
        "Methotrexate": "MODERATE: May increase toxicity of Methotrexate.",
        "Oral Contraceptives": "LOW: May slightly reduce effectiveness of birth control."
    }
}

# ---------------------------------------------------------------------------
# 2) EXPANDED SYMPTOM SYNONYMS
# ---------------------------------------------------------------------------
SYMPTOM_SYNONYMS = {
    "loose motions": "diarrhea", "loose stools": "diarrhea", "watery stool": "diarrhea",
    "running nose": "runny nose", "blocked nose": "congestion", "stuffy nose": "congestion",
    "body pain": "body ache", "muscle ache": "muscle pain", "muscular pain": "muscle pain",
    "throwing up": "vomiting", "puking": "vomiting", "feeling nauseous": "nausea",
    "can't breathe": "shortness of breath", "breathing difficulty": "difficulty breathing",
    "breathlessness": "shortness of breath", "hard to breathe": "shortness of breath",
    "high temperature": "high fever", "temperature": "fever", "pyrexia": "fever",
    "head pain": "headache", "migraine": "severe headache",
    "tummy ache": "stomach pain", "belly pain": "stomach pain", "stomach ache": "stomach pain",
    "abdominal pain": "stomach pain", "cramps": "stomach cramps",
    "feeling tired": "fatigue", "tiredness": "fatigue", "no energy": "fatigue",
    "exhaustion": "fatigue", "lethargy": "fatigue", "feeling weak": "weakness",
    "sore eyes": "itchy eyes", "eye irritation": "itchy eyes", "pink eye": "red eyes",
    "pee burning": "burning urination", "painful urination": "burning urination",
    "can't smell": "loss of smell", "can't taste": "loss of taste",
    "no taste": "loss of taste", "no smell": "loss of smell",
    "light sensitivity": "sensitivity to light", "photophobia": "sensitivity to light",
    "skin rash": "rash", "skin eruption": "rash", "hives": "rash",
    "swollen joints": "joint swelling", "achy joints": "joint pain",
    "stiff joints": "stiffness", "rigid joints": "stiffness",
    "throwing up blood": "vomiting", "blood vomit": "coughing blood",
    "yellow skin": "jaundice", "yellow eyes": "jaundice",
    "racing heart": "rapid heartbeat", "heart pounding": "rapid heartbeat",
    "can't sleep": "difficulty sleeping", "insomnia": "difficulty sleeping",
    "hair falling": "hair loss", "losing hair": "hair loss",
    "gaining weight": "weight gain", "losing weight": "weight loss",
    "feeling dizzy": "dizziness", "lightheaded": "dizziness",
    "itchy skin": "itching", "scratching": "itching",
    "chest tightness": "chest pain", "chest pressure": "chest pain",
    "sore throat": "sore throat", "throat pain": "sore throat",
    "swallowing difficulty": "difficulty swallowing", "painful swallowing": "difficulty swallowing",
    "bloody stool": "blood in stool", "bloody urine": "blood in urine",
    "peeing a lot": "frequent urination", "urinating often": "frequent urination",
    "feeling thirsty": "increased thirst", "very thirsty": "increased thirst",
    "blurry vision": "blurred vision", "vision problems": "blurred vision",
    "night sweats": "night sweats", "sweating at night": "night sweats",
    "swollen glands": "swollen lymph nodes", "lumps in neck": "swollen lymph nodes",
    "acidity": "heartburn", "acid reflux": "heartburn",
    "gas problem": "gas", "flatulence": "gas", "bloated stomach": "bloating",
    "fits": "seizures", "convulsions": "seizures",
    "memory loss": "confusion", "forgetfulness": "confusion",
    "skin peeling": "dry skin", "flaky skin": "dry skin",
    "cold hands and feet": "cold hands", "cold extremities": "cold hands",
}

# ---------------------------------------------------------------------------
# 2.1) HEREDITARY RISK KNOWLEDGE BASE — 20+ conditions
# ---------------------------------------------------------------------------
HEREDITARY_DB = {
    "Diabetes (Type 2)": {
        "risk_multiplier": {"parent": 0.4, "sibling": 0.3, "grandparent": 0.1},
        "prevention": ["Regular glucose monitoring (HbA1c every 3 months)", "Low glycemic index diet - avoid refined sugar", "30 mins aerobic exercise daily", "Maintain BMI below 25"],
        "warning_signs": ["Frequent urination", "Unusual thirst", "Blurred vision", "Slow-healing cuts"]
    },
    "Hypertension": {
        "risk_multiplier": {"parent": 0.35, "sibling": 0.25, "grandparent": 0.15},
        "prevention": ["Limit sodium to 2g/day", "DASH diet (fruits, vegetables, low-fat dairy)", "Stress reduction through meditation/yoga", "Blood pressure check every 6 months"],
        "warning_signs": ["Morning headaches", "Nosebleeds", "Shortness of breath", "Vision changes"]
    },
    "Heart Attack": {
        "risk_multiplier": {"parent": 0.5, "sibling": 0.4, "grandparent": 0.2},
        "prevention": ["Annual cardiovascular screening with ECG", "Fasting lipid profile every 6 months", "Omega-3 rich diet (fish, flaxseed, walnuts)", "Quit smoking immediately", "Limit alcohol to 1 unit/day"],
        "warning_signs": ["Chest tightness", "Pain radiating to left arm", "Excessive sweating", "Jaw pain"]
    },
    "Breast Cancer": {
        "risk_multiplier": {"parent": 0.6, "sibling": 0.5, "grandparent": 0.25},
        "prevention": ["Mammogram screening from age 35", "Monthly self-breast examination", "BRCA1/BRCA2 genetic testing", "Maintain healthy weight", "Limit alcohol"],
        "warning_signs": ["Lump in breast/armpit", "Skin dimpling", "Nipple discharge", "Breast shape changes"]
    },
    "Glaucoma": {
        "risk_multiplier": {"parent": 0.3, "sibling": 0.2, "grandparent": 0.1},
        "prevention": ["Annual eye pressure (IOP) test", "Avoid excessive caffeine", "Protective UV-blocking eyewear", "Regular optic nerve check"],
        "warning_signs": ["Peripheral vision loss", "Eye pain", "Halos around lights", "Blurred vision"]
    },
    "Colorectal Cancer": {
        "risk_multiplier": {"parent": 0.45, "sibling": 0.35, "grandparent": 0.15},
        "prevention": ["Colonoscopy screening from age 40", "High-fiber diet (vegetables, legumes, whole grains)", "Avoid processed meats", "Regular exercise"],
        "warning_signs": ["Blood in stool", "Unexplained weight loss", "Change in bowel habits", "Abdominal cramping"]
    },
    "Osteoporosis": {
        "risk_multiplier": {"parent": 0.35, "sibling": 0.25, "grandparent": 0.15},
        "prevention": ["Calcium-rich diet (dairy, leafy greens, almonds)", "Vitamin D supplementation 1000 IU/day", "Weight-bearing exercises (walking, dancing)", "Bone density (DEXA) scan from age 50"],
        "warning_signs": ["Back pain", "Loss of height over time", "Stooped posture", "Easy bone fractures"]
    },
    "Asthma": {
        "risk_multiplier": {"parent": 0.3, "sibling": 0.25, "grandparent": 0.1},
        "prevention": ["Avoid known allergens (dust, pollen, pet dander)", "HEPA air purifiers at home", "Annual pulmonary function test", "Keep rescue inhaler accessible"],
        "warning_signs": ["Wheezing", "Nighttime coughing", "Shortness of breath on exertion", "Chest tightness"]
    },
    "Thyroid Disease": {
        "risk_multiplier": {"parent": 0.35, "sibling": 0.28, "grandparent": 0.12},
        "prevention": ["Annual TSH blood test", "Adequate iodine in diet (iodized salt, seafood)", "Avoid excessive soy consumption", "Manage stress levels"],
        "warning_signs": ["Unexplained weight changes", "Fatigue or hyperactivity", "Hair loss", "Temperature sensitivity"]
    },
    "Alzheimer's Disease": {
        "risk_multiplier": {"parent": 0.35, "sibling": 0.28, "grandparent": 0.1},
        "prevention": ["Regular mental stimulation (puzzles, reading, learning)", "Mediterranean diet (olive oil, fish, nuts)", "Social engagement and community activities", "Quality sleep 7-9 hours/night", "Cardiovascular health management"],
        "warning_signs": ["Memory loss affecting daily life", "Confusion with time/place", "Difficulty with familiar tasks", "Personality changes"]
    },
    "Kidney Disease": {
        "risk_multiplier": {"parent": 0.3, "sibling": 0.22, "grandparent": 0.1},
        "prevention": ["Annual kidney function test (eGFR, creatinine)", "Stay hydrated (2-3 liters/day)", "Limit NSAID painkiller use", "Control blood sugar and blood pressure"],
        "warning_signs": ["Swollen ankles/feet", "Foamy urine", "Fatigue", "Back pain near kidneys"]
    },
    "Rheumatoid Arthritis": {
        "risk_multiplier": {"parent": 0.3, "sibling": 0.22, "grandparent": 0.08},
        "prevention": ["Anti-inflammatory diet (omega-3 fatty acids)", "Quit smoking (major risk factor)", "Maintain healthy weight", "Regular low-impact exercise (swimming, yoga)"],
        "warning_signs": ["Morning joint stiffness lasting >1 hour", "Symmetrical joint swelling", "Fatigue", "Low-grade fever"]
    },
    "Depression": {
        "risk_multiplier": {"parent": 0.3, "sibling": 0.25, "grandparent": 0.1},
        "prevention": ["Regular aerobic exercise (proven antidepressant effect)", "Social connection and support networks", "Mindfulness and CBT techniques", "Adequate sleep routine", "Limit alcohol consumption"],
        "warning_signs": ["Persistent sadness for 2+ weeks", "Loss of interest in activities", "Sleep disturbances", "Concentration difficulties"]
    },
    "PCOS": {
        "risk_multiplier": {"parent": 0.5, "sibling": 0.4, "grandparent": 0.15},
        "prevention": ["Maintain healthy BMI", "Low glycemic index diet", "Regular menstrual cycle monitoring", "Annual hormonal panel (LH, FSH, testosterone)"],
        "warning_signs": ["Irregular periods", "Acne", "Excess facial hair", "Weight gain around waist"]
    },
    "Stroke": {
        "risk_multiplier": {"parent": 0.4, "sibling": 0.3, "grandparent": 0.15},
        "prevention": ["Control hypertension (target <130/80)", "Quit smoking", "Manage atrial fibrillation", "Annual carotid artery ultrasound if high risk"],
        "warning_signs": ["Sudden numbness on one side", "Facial drooping", "Slurred speech", "Sudden severe headache"]
    }
}

# ---------------------------------------------------------------------------
# 2.2) DRUG-TO-DISEASE MAPPING (for auto genetic risk inference)
# ---------------------------------------------------------------------------
DRUG_TO_DISEASE_MAP = {
    "metformin": "Diabetes (Type 2)", "glycomet": "Diabetes (Type 2)", "insulin": "Diabetes (Type 2)",
    "amlodipine": "Hypertension", "losartan": "Hypertension", "lisinopril": "Hypertension",
    "enalapril": "Hypertension", "atenolol": "Hypertension", "metoprolol": "Hypertension",
    "hydrochlorothiazide": "Hypertension", "telma": "Hypertension", "stamlo": "Hypertension",
    "furosemide": "Kidney Disease", "warfarin": "Heart Attack", "clopidogrel": "Heart Attack",
    "ecosprin": "Heart Attack", "aspirin": "Heart Attack", "atorvastatin": "Heart Attack",
    "atorva": "Heart Attack", "levothyroxine": "Thyroid Disease",
    "salbutamol": "Asthma", "montelukast": "Asthma", "prednisolone": "Asthma",
    "sertraline": "Depression", "fluoxetine": "Depression", "alprazolam": "Depression",
    "gabapentin": "Rheumatoid Arthritis", "diclofenac": "Rheumatoid Arthritis",
    "shelcal": "Osteoporosis", "calcium": "Osteoporosis", "vitamin d": "Osteoporosis",
}

# ---------------------------------------------------------------------------
# 3) MEDICAL ABBREVIATION EXPANDER
# ---------------------------------------------------------------------------
ABBREVIATIONS = {
    "BD": "Twice Daily", "BID": "Twice Daily",
    "TDS": "Three Times Daily", "TID": "Three Times Daily",
    "QID": "Four Times Daily", "OD": "Once Daily", "QD": "Once Daily",
    "PRN": "As Needed", "SOS": "If Required",
    "AC": "Before Meals", "PC": "After Meals",
    "HS": "At Bedtime", "STAT": "Immediately",
    "PO": "By Mouth", "IM": "Intramuscular", "IV": "Intravenous",
    "SC": "Subcutaneous", "SL": "Sublingual",
    "TAB": "Tablet", "CAP": "Capsule", "SYP": "Syrup",
    "INJ": "Injection", "SUSP": "Suspension", "OINT": "Ointment",
    "GTT": "Drops", "CR": "Controlled Release", "SR": "Sustained Release",
    "XR": "Extended Release", "ER": "Extended Release",
    "MG": "Milligrams", "ML": "Millilitres", "MCG": "Micrograms",
    "GM": "Grams", "IU": "International Units",
    "QHS": "Every Night", "QAM": "Every Morning",
    "NPO": "Nothing By Mouth", "Rx": "Prescription",
    "Dx": "Diagnosis", "Hx": "History", "Tx": "Treatment",
    "SOB": "Shortness of Breath", "HTN": "Hypertension",
    "DM": "Diabetes Mellitus", "BP": "Blood Pressure",
    "HR": "Heart Rate", "RR": "Respiratory Rate",
    "WBC": "White Blood Cells", "RBC": "Red Blood Cells",
    "Hb": "Hemoglobin", "CBC": "Complete Blood Count",
    "ECG": "Electrocardiogram", "CT": "CT Scan", "MRI": "MRI Scan",
}

# ---------------------------------------------------------------------------
# 4) COMMON DRUG NAMES (for OCR matching)
# ---------------------------------------------------------------------------
DRUG_NAMES = [
    "paracetamol","acetaminophen","ibuprofen","aspirin","amoxicillin","azithromycin",
    "ciprofloxacin","metformin","atorvastatin","omeprazole","pantoprazole","ranitidine",
    "cetirizine","loratadine","montelukast","salbutamol","prednisolone","dexamethasone",
    "metronidazole","doxycycline","ceftriaxone","diclofenac","naproxen","tramadol",
    "amlodipine","losartan","enalapril","lisinopril","hydrochlorothiazide","furosemide",
    "metoprolol","atenolol","propranolol","clopidogrel","warfarin","insulin",
    "levothyroxine","domperidone","ondansetron","loperamide","bisacodyl","lactulose",
    "multivitamin","folic acid","iron","calcium","vitamin d","vitamin b12","vitamin c",
    "gabapentin","pregabalin","sertraline","fluoxetine","alprazolam","diazepam",
    "clonazepam","phenytoin","carbamazepine","valproic acid","lithium",
    "crocin","dolo","combiflam","augmentin","zifi","pan","rantac","allegra",
    "shelcal","ecosprin","glycomet","telma","stamlo","atorva","udiliv",
]


# ===================================================================
# CORE NLP ENGINE
# ===================================================================

def normalize_symptoms(text: str) -> str:
    text = text.lower().strip()
    # Replace synonyms (longest first to avoid partial matches)
    for informal, canonical in sorted(SYMPTOM_SYNONYMS.items(), key=lambda x: len(x[0]), reverse=True):
        text = text.replace(informal, canonical)
    return text


def extract_symptoms(text: str) -> list:
    text = normalize_symptoms(text)
    all_symptoms = set()
    for disease_info in DISEASE_DB.values():
        for s in disease_info["symptoms"]:
            all_symptoms.add(s)

    found = []
    for symptom in sorted(all_symptoms, key=len, reverse=True):
        if symptom in text:
            found.append(symptom)
            text = text.replace(symptom, "")
    
    # Check for family history keywords
    family_keywords = ["family", "father", "mother", "parent", "history", "genetic", "hereditary"]
    if any(k in text.lower() for k in family_keywords):
        found.append("Family History Mentioned")
        
    return found


def compute_disease_scores(extracted: list) -> list:
    if not extracted:
        return []

    extracted_set = set(extracted)
    scores = []
    
    # [SIMULATED RAG] Vector DB Retrieval Simulation
    print(f"[RAG] Querying vector database for symptoms: {extracted_set}")

    for disease, info in DISEASE_DB.items():
        disease_symptoms = set(info["symptoms"])
        intersection = extracted_set & disease_symptoms

        if not intersection:
            continue

        recall = len(intersection) / len(extracted_set) if extracted_set else 0
        precision = len(intersection) / len(disease_symptoms) if disease_symptoms else 0

        if recall + precision > 0:
            confidence = round((1.5 * recall * precision) / (0.5 * recall + precision), 3)
        else:
            confidence = 0

        confidence = min(0.99, confidence + 0.04 * len(intersection))

        matched_list = sorted(list(intersection))
        reasons = generate_explanation(disease, info, matched_list, extracted_set)
        scores.append({
            "disease": disease,
            "confidence": round(confidence, 2),
            "severity": info["severity"],
            "matched_symptoms": matched_list,
            "total_disease_symptoms": len(disease_symptoms),
            "explanation": f"Matched {len(matched_list)}/{len(disease_symptoms)} symptoms: {', '.join(matched_list)}",
            "reasons": reasons
        })

    scores.sort(key=lambda x: x["confidence"], reverse=True)
    return scores[:8]


def generate_explanation(disease, info, matched, all_extracted):
    """Generate human-readable reasons for a prediction."""
    reasons = []
    count = len(matched)
    total = len(info["symptoms"])
    pct = int(count / total * 100)
    reasons.append(f"You reported {count} out of {total} known symptoms of {disease} ({pct}% match).")
    if count >= 3:
        reasons.append(f"Multiple overlapping symptoms ({', '.join(matched[:3])}) strongly suggest this condition.")
    if info["severity"] == "critical":
        reasons.append("🚨 EMERGENCY: This is a critical condition. We have generated an Emergency Triage QR code for you.")
        reasons.append("IMMEDIATE ACTION: Call emergency services now.")
    elif info["severity"] == "high":
        reasons.append("⚠️ HIGH SEVERITY: This condition requires urgent medical consultation.")
    missing = set(info["symptoms"]) - set(matched)
    if missing:
        reasons.append(f"Additional symptoms to watch for: {', '.join(list(missing)[:3])}.")
    return reasons


# ===================================================================
# OCR IMAGE PREPROCESSING — Multi-strategy
# ===================================================================

def preprocess_image(image_path):
    """Apply multiple preprocessing strategies and return the best version."""
    try:
        import cv2
        import numpy as np

        img = cv2.imread(image_path)
        if img is None:
            print("[OCR] Could not read image")
            return image_path

        # Resize
        h, w = img.shape[:2]
        scale = 1.0
        if max(w, h) > 2000:
            scale = 2000 / max(w, h)
        elif max(w, h) < 1000:
            scale = 1000 / max(w, h)
        if scale != 1.0:
            img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Strategy 1: Adaptive threshold
        blur1 = cv2.GaussianBlur(gray, (3, 3), 0)
        thresh1 = cv2.adaptiveThreshold(blur1, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)

        # Strategy 2: OTSU threshold
        blur2 = cv2.GaussianBlur(gray, (5, 5), 0)
        _, thresh2 = cv2.threshold(blur2, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Strategy 3: Morphological cleanup
        kernel = np.ones((1, 1), np.uint8)
        morph = cv2.dilate(thresh1, kernel, iterations=1)
        morph = cv2.erode(morph, kernel, iterations=1)

        # Save all strategies
        base = os.path.dirname(image_path)
        paths = []
        for i, processed in enumerate([thresh1, thresh2, morph, gray]):
            p = os.path.join(base, f'_ocr_strat_{i}.png')
            cv2.imwrite(p, processed)
            paths.append(p)

        # Also keep original
        paths.append(image_path)
        return paths

    except Exception as e:
        print(f"[OCR] Preprocessing error: {e}")
        return [image_path]


def fuzzy_match(word, candidates, threshold=0.6):
    """Simple fuzzy matching using character overlap ratio."""
    word = word.lower().strip()
    if len(word) < 3:
        return None
    best_match = None
    best_score = 0
    for candidate in candidates:
        c = candidate.lower()
        # Check substring
        if c in word or word in c:
            return candidate
        # Character bigram overlap
        w_bigrams = set(word[i:i+2] for i in range(len(word)-1))
        c_bigrams = set(c[i:i+2] for i in range(len(c)-1))
        if not w_bigrams or not c_bigrams:
            continue
        overlap = len(w_bigrams & c_bigrams) / max(len(w_bigrams), len(c_bigrams))
        if overlap > best_score and overlap >= threshold:
            best_score = overlap
            best_match = candidate
    return best_match


def find_drugs_in_text(text):
    """Find drug names using exact + fuzzy matching."""
    text_lower = text.lower()
    found = set()
    # Exact match first
    for drug in DRUG_NAMES:
        if drug in text_lower:
            found.add(drug.title())
    # Fuzzy match each word
    # Fuzzy match each word (high threshold to reduce false positives)
    words = re.findall(r'[a-zA-Z]{5,}', text)
    for word in words:
        match = fuzzy_match(word, DRUG_NAMES, threshold=0.72)
        if match:
            found.add(match.title())
    return list(found)


def generate_patient_summary(cleaned_text, drugs_found, abbrs_found):
    """Generate a simple, patient-friendly prescription summary."""
    summary_lines = []
    summary_lines.append("[PRESCRIPTION SUMMARY]")
    summary_lines.append("=" * 30)

    if drugs_found:
        summary_lines.append("")
        summary_lines.append("[Medications Prescribed]")
        for i, drug in enumerate(drugs_found, 1):
            summary_lines.append(f"   {i}. {drug}")

    if abbrs_found:
        summary_lines.append("")
        summary_lines.append("[Dosage Instructions Found]")
        timing_abbrs = [a for a in abbrs_found if a['meaning'] in ['Twice Daily','Three Times Daily','Once Daily','Four Times Daily','Before Meals','After Meals','At Bedtime','As Needed','If Required']]
        form_abbrs = [a for a in abbrs_found if a['meaning'] in ['Tablet','Capsule','Syrup','Injection','Drops','Suspension','Ointment']]
        for a in timing_abbrs:
            summary_lines.append(f"   - {a['abbr']} = Take {a['meaning']}")
        if form_abbrs:
            summary_lines.append("")
            summary_lines.append("[Medicine Forms]")
            for a in form_abbrs:
                summary_lines.append(f"   - {a['abbr']} = {a['meaning']}")

    # Extract patient info from text
    age_match = re.search(r'age[:\s]*([\d]+)', cleaned_text, re.IGNORECASE)
    gender_match = re.search(r'gender[:\s]*(m|f|male|female)', cleaned_text, re.IGNORECASE)
    date_match = re.search(r'date[:\s]*([\d/\-\.]+)', cleaned_text, re.IGNORECASE)
    if age_match or gender_match or date_match:
        summary_lines.insert(2, "")
        summary_lines.insert(3, "[Patient Info]")
        idx = 4
        if age_match:
            summary_lines.insert(idx, f"   Age: {age_match.group(1)}")
            idx += 1
        if gender_match:
            g = 'Male' if gender_match.group(1).lower().startswith('m') else 'Female'
            summary_lines.insert(idx, f"   Gender: {g}")
            idx += 1
        if date_match:
            summary_lines.insert(idx, f"   Date: {date_match.group(1)}")

    summary_lines.append("")
    summary_lines.append("Note: This is an AI-generated summary.")
    summary_lines.append("Always follow your doctor's verbal instructions.")
    return "\n".join(summary_lines)


# ===================================================================
# Initialize Groq (vision + text — no EasyOCR)
# ===================================================================
from groq import Groq

GROQ_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_VISION_MODEL = os.environ.get("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
GROQ_TEXT_MODEL = os.environ.get("GROQ_TEXT_MODEL", "llama-3.3-70b-versatile")

groq_client = None
if GROQ_KEY:
    try:
        groq_client = Groq(api_key=GROQ_KEY)
        print(f"[AI] Groq API ready (vision: {GROQ_VISION_MODEL})")
    except Exception as e:
        print(f"[AI] Groq configuration error: {e}")


def parse_groq_json(text):
    """Extract JSON from Groq response, stripping markdown wrappers."""
    cleaned = text.strip()
    if '```json' in cleaned:
        cleaned = cleaned.split('```json')[1].split('```')[0].strip()
    elif '```' in cleaned:
        cleaned = cleaned.split('```')[1].split('```')[0].strip()
    return json.loads(cleaned)


def build_patient_summary_from_meds(medications):
    """Build a simple text summary from structured medications."""
    lines = ["[PRESCRIPTION SUMMARY — EASY TO READ]", ""]
    for i, med in enumerate(medications or [], 1):
        name = med.get('drug_name') or med.get('name') or 'Unknown medicine'
        lines.append(f"{i}. {name} {med.get('dosage', '')}".strip())
        if med.get('frequency'):
            lines.append(f"   • How often: {med['frequency']}")
        if med.get('duration'):
            lines.append(f"   • For how long: {med['duration']}")
        guide = med.get('layman_guide') or {}
        for step in guide.get('how_to_take') or []:
            lines.append(f"   • {step}")
    lines.append("")
    lines.append("Note: AI-generated summary. Always follow your doctor's advice.")
    return "\n".join(lines)


SYMPTOM_SYSTEM_PROMPT = """You are Clinica-Diff Universal Triage AI — a world-class clinical reasoning engine powered by Groq.

Your knowledge spans the full spectrum of human disease globally:
- Infectious (bacterial, viral, fungal, parasitic, tropical, zoonotic)
- Autoimmune, inflammatory, allergic
- Cardiovascular, respiratory, renal, hepatic, endocrine, hematologic
- Neurological, psychiatric, neurodevelopmental
- Musculoskeletal, rheumatologic, orthopedic
- Dermatologic, ophthalmologic, ENT, dental
- Gastrointestinal, hepatobiliary, nutritional
- Oncologic (cancers of all organ systems)
- Genetic, congenital, metabolic, mitochondrial
- Reproductive, gynecologic, obstetric, urologic, andrologic
- Pediatric, geriatric, occupational, environmental, travel-related
- Rare/orphan diseases (Ehlers-Danlos, Marfan, Wilson, Addison, etc.) when symptoms fit

RULES:
1. Think like a senior physician doing differential diagnosis — not keyword matching.
2. Consider symptom duration, pattern, red flags, age hints, and travel/exposure if mentioned.
3. Include rare conditions when clinically plausible — label them is_rare: true.
4. Never claim certainty — this is decision support, not a diagnosis.
5. If symptoms suggest emergency, set emergency_now: true and urgency_level: "emergency".
6. Respond ONLY with valid JSON — no markdown.
7. CRITICAL — Hepatobiliary: If the patient mentions yellow skin, yellow eyes, yellowing of skin/eyes, icterus, dark urine, pale/clay stools, right upper abdominal pain, liver pain, itching with yellow discoloration, or the word "jaundice", you MUST include Jaundice and relevant causes (Hepatitis A/B/C, Obstructive jaundice, Hemolytic anemia, Gilbert syndrome, Alcoholic liver disease, Gallstones) in predictions with appropriate confidence — do not omit these."""


JAUNDICE_SYMPTOM_HINTS = [
    'jaundice', 'yellow skin', 'yellow eyes', 'yellowish', 'icterus', 'yellowing',
    'dark urine', 'pale stool', 'clay colored', 'liver pain', 'hepatitis',
    'right upper abdominal', 'ruq pain', 'bilirubin', 'yellow sclera',
]


def ensure_hepatobiliary_in_predictions(raw_symptoms, predictions):
    """Boost hepatobiliary differentials when jaundice-related symptoms are described."""
    text = (raw_symptoms or '').lower()
    if not any(h in text for h in JAUNDICE_SYMPTOM_HINTS):
        return predictions

    hepatobiliary_terms = ('jaundice', 'hepatitis', 'liver', 'bilirubin', 'cholestasis', 'gallstone', 'cirrhosis')
    has_hep = any(
        any(t in (p.get('disease') or '').lower() for t in hepatobiliary_terms)
        for p in predictions
    )
    if has_hep:
        return predictions

    jaundice_entry = normalize_symptom_prediction({
        'disease': 'Jaundice (Hyperbilirubinemia)',
        'confidence': 0.78,
        'severity': 'moderate',
        'disease_category': 'hepatobiliary',
        'body_part': 'hepatic',
        'specialist': 'Gastroenterologist / Hepatologist',
        'is_rare': False,
        'matched_symptoms': [h for h in JAUNDICE_SYMPTOM_HINTS if h in text][:4] or ['jaundice-related symptoms'],
        'reasons': [
            'Yellow discoloration pattern suggests elevated bilirubin',
            'Hepatobiliary system involvement is clinically likely',
            'Requires liver function tests and urgent medical evaluation',
        ],
        'layman_explanation': 'Jaundice means bile pigment builds up in your body, often making skin and eyes look yellow. This needs a doctor to find the cause.',
        'immediate_action': 'See a doctor within 24 hours for liver blood tests. Avoid alcohol until evaluated.',
        'watch_out_for': ['Confusion or drowsiness', 'Vomiting blood', 'Severe abdominal pain', 'High fever with jaundice'],
    })
    predictions = [jaundice_entry] + list(predictions)
    predictions.sort(key=lambda x: x['confidence'], reverse=True)
    return predictions[:12]


def normalize_symptom_prediction(p):
    """Normalize a single prediction object from Groq."""
    p = dict(p or {})
    p['confidence'] = round(min(0.99, max(0.01, float(p.get('confidence', 0.5)))), 2)
    p['severity'] = p.get('severity') or 'moderate'
    if p['severity'] not in ('mild', 'moderate', 'high', 'critical', 'unknown'):
        p['severity'] = 'moderate'
    p['matched_symptoms'] = p.get('matched_symptoms') or []
    p['reasons'] = p.get('reasons') or []
    p['watch_out_for'] = p.get('watch_out_for') or []
    p['body_part'] = p.get('body_part') or p.get('body_system') or 'general'
    p['body_system'] = p['body_part']
    p['specialist'] = p.get('specialist') or p.get('recommended_specialist') or 'General Physician'
    p['immediate_action'] = p.get('immediate_action') or 'Consult a qualified doctor for proper evaluation.'
    p['layman_explanation'] = p.get('layman_explanation') or ''
    p['is_rare'] = bool(p.get('is_rare', False))
    p['disease_category'] = p.get('disease_category') or 'general'
    return p


def analyze_symptoms_with_groq(raw_symptoms, patient_age=None, patient_sex=None, duration_days=None):
    """Full global differential diagnosis via Groq."""
    context_parts = []
    if patient_age:
        context_parts.append(f"Age: {patient_age}")
    if patient_sex:
        context_parts.append(f"Sex: {patient_sex}")
    if duration_days:
        context_parts.append(f"Symptom duration: ~{duration_days} days")
    context_line = (" | ".join(context_parts) + "\n") if context_parts else ""

    user_prompt = f"""{context_line}Patient describes symptoms:
\"\"\"{raw_symptoms}\"\"\"

Perform exhaustive clinical reasoning. Return JSON with this exact structure:
{{
  "clinical_summary": "2-3 sentence plain-language summary of what the symptom pattern suggests overall",
  "urgency_level": "routine|soon|urgent|emergency",
  "emergency_now": false,
  "emergency_reason": "only if emergency_now is true — why",
  "recommended_specialist": "best single specialist to see first",
  "possible_causes_layman": [
    "Bullet: simple explanation of what might be going on #1",
    "Bullet #2",
    "Bullet #3"
  ],
  "home_care_steps": [
    "Safe step 1 patient can do now",
    "Safe step 2",
    "Safe step 3"
  ],
  "when_to_seek_emergency": [
    "Red flag 1 → go to ER immediately",
    "Red flag 2",
    "Red flag 3"
  ],
  "questions_for_doctor": [
    "Question patient should ask their doctor #1",
    "Question #2",
    "Question #3"
  ],
  "differential_diagnosis": [
    "Condition that must be ruled out #1",
    "Condition #2",
    "Condition #3"
  ],
  "predictions": [
    {{
      "disease": "Full medical condition name",
      "confidence": 0.85,
      "severity": "mild|moderate|high|critical",
      "disease_category": "infectious|cardiovascular|neurological|etc",
      "body_part": "primary body system",
      "specialist": "e.g. Cardiologist, Neurologist",
      "is_rare": false,
      "matched_symptoms": ["symptom from input"],
      "reasons": ["clinical reason 1", "reason 2", "reason 3"],
      "layman_explanation": "1-2 sentences a non-doctor can understand",
      "immediate_action": "what to do right now",
      "watch_out_for": ["warning sign 1", "warning sign 2", "warning sign 3"]
    }}
  ]
}}

Requirements:
- Return 8-12 predictions in "predictions", sorted by confidence descending.
- Cover diverse categories — do NOT only list common cold / flu unless symptoms fit.
- Include at least 1 rare/orphan possibility if remotely plausible (is_rare: true).
- Include tropical/travel diseases if travel, fever, or exposure is mentioned.
- Include mental health conditions if mood, anxiety, or psych symptoms appear.
- Match confidence honestly — do not inflate all to 0.9+.
- If ANY jaundice or yellow skin/eye symptoms appear, Jaundice and Hepatitis must appear in the top predictions."""

    response = groq_client.chat.completions.create(
        model=GROQ_TEXT_MODEL,
        messages=[
            {"role": "system", "content": SYMPTOM_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.12,
        max_tokens=4096,
    )
    data = parse_groq_json(response.choices[0].message.content)

    if isinstance(data, list):
        data = {"predictions": data}

    predictions = [normalize_symptom_prediction(p) for p in (data.get('predictions') or [])]
    predictions = ensure_hepatobiliary_in_predictions(raw_symptoms, predictions)
    predictions.sort(key=lambda x: x['confidence'], reverse=True)

    return {
        "clinical_summary": data.get('clinical_summary', ''),
        "urgency_level": data.get('urgency_level', 'routine'),
        "emergency_now": bool(data.get('emergency_now', False)),
        "emergency_reason": data.get('emergency_reason', ''),
        "recommended_specialist": data.get('recommended_specialist', 'General Physician'),
        "possible_causes_layman": data.get('possible_causes_layman') or [],
        "home_care_steps": data.get('home_care_steps') or [],
        "when_to_seek_emergency": data.get('when_to_seek_emergency') or [],
        "questions_for_doctor": data.get('questions_for_doctor') or [],
        "differential_diagnosis": data.get('differential_diagnosis') or [],
        "predictions": predictions,
    }


# ===================================================================
# FLASK ENDPOINTS
# ===================================================================

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json or {}
        raw_symptoms = (data.get('symptoms') or '').strip()
        if not raw_symptoms:
            return jsonify({"status": "error", "message": "No symptoms provided"}), 400

        patient_age = data.get('age') or data.get('patient_age')
        patient_sex = data.get('sex') or data.get('patient_sex')
        duration_days = data.get('duration_days')

        distress_keywords = [
            'emergency', 'dying', 'unbearable', 'severe pain', "can't breathe",
            'heart attack', 'stroke', 'fainting', 'unconscious', 'bleeding heavily',
            'chest pain', 'suicidal', 'overdose', "can't move", 'paralysis',
        ]
        is_distressed = any(kw in raw_symptoms.lower() for kw in distress_keywords)

        analysis = None
        predictions = []
        engine = 'rule_based'

        if groq_client:
            try:
                analysis = analyze_symptoms_with_groq(
                    raw_symptoms, patient_age, patient_sex, duration_days
                )
                predictions = analysis.get('predictions', [])
                engine = 'groq_universal'
                print(f"[Groq] Universal triage: {len(predictions)} conditions for: {raw_symptoms[:80]}")
            except Exception as ge:
                print(f"[Groq] Universal triage failed: {ge}. Falling back to rule-based.")

        if not predictions:
            extracted = extract_symptoms(raw_symptoms)
            rule_predictions = compute_disease_scores(extracted)
            if rule_predictions:
                predictions = [normalize_symptom_prediction(p) for p in rule_predictions]
            else:
                predictions = [normalize_symptom_prediction({
                    "disease": "Symptom Pattern Requires Clinical Evaluation",
                    "confidence": 0.15,
                    "severity": "moderate",
                    "matched_symptoms": extracted,
                    "body_part": "general",
                    "specialist": "General Physician",
                    "reasons": [
                        "Symptoms need a structured clinical history and examination.",
                        "AI could not narrow to a single pattern — multiple conditions possible.",
                        "A doctor can order tests to confirm or rule out serious causes.",
                    ],
                    "layman_explanation": "Your symptoms could have several explanations. A doctor visit is the safest next step.",
                    "immediate_action": "Book a general physician appointment within 24-48 hours.",
                    "watch_out_for": ["Difficulty breathing", "Chest pain", "Sudden confusion or weakness"],
                })]
            analysis = analysis or {
                "clinical_summary": "Rule-based analysis used. For broader coverage, ensure Groq API is configured.",
                "urgency_level": "soon" if is_distressed else "routine",
                "emergency_now": is_distressed,
                "recommended_specialist": "General Physician",
                "possible_causes_layman": [],
                "home_care_steps": ["Rest", "Stay hydrated", "Monitor symptoms"],
                "when_to_seek_emergency": ["Severe or worsening symptoms", "Difficulty breathing", "Chest pain"],
                "questions_for_doctor": ["What tests do I need?", "Could this be serious?", "What should I avoid?"],
                "differential_diagnosis": [p['disease'] for p in predictions[:5]],
            }

        if is_distressed:
            analysis['emergency_now'] = True
            analysis['urgency_level'] = 'emergency'
            if predictions and predictions[0].get('severity') != 'critical':
                predictions[0]['severity'] = 'critical'
                predictions[0]['reasons'] = (
                    ['High distress / emergency keywords detected in your description.']
                    + (predictions[0].get('reasons') or [])
                )

        return jsonify({
            "status": "success",
            "symptoms_raw": raw_symptoms,
            "symptoms_extracted": extract_symptoms(raw_symptoms),
            "predictions": predictions,
            "clinical_summary": analysis.get('clinical_summary', ''),
            "urgency_level": analysis.get('urgency_level', 'routine'),
            "emergency_now": analysis.get('emergency_now', False),
            "emergency_reason": analysis.get('emergency_reason', ''),
            "recommended_specialist": analysis.get('recommended_specialist', ''),
            "possible_causes_layman": analysis.get('possible_causes_layman', []),
            "home_care_steps": analysis.get('home_care_steps', []),
            "when_to_seek_emergency": analysis.get('when_to_seek_emergency', []),
            "questions_for_doctor": analysis.get('questions_for_doctor', []),
            "differential_diagnosis": analysis.get('differential_diagnosis', []),
            "prediction_count": len(predictions),
            "sentiment_distress_detected": is_distressed,
            "engine": engine,
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500



@app.route('/check-interaction', methods=['POST'])
def check_interaction():
    """Check for dangerous interactions between medications."""
    try:
        data = request.json
        new_drugs = [d.title() for d in data.get('new_drugs', [])]
        existing_history = [d.title() for d in data.get('existing_meds', [])]
        
        interactions = []
        all_meds = list(set(new_drugs + existing_history))
        
        for i in range(len(all_meds)):
            for j in range(i + 1, len(all_meds)):
                drug1, drug2 = all_meds[i], all_meds[j]
                
                # Check DDI_DB in both directions
                reason = DDI_DB.get(drug1, {}).get(drug2) or DDI_DB.get(drug2, {}).get(drug1)
                
                if reason:
                    severity = "CRITICAL" if "CRITICAL" in reason.upper() else "HIGH" if "HIGH" in reason.upper() else "MODERATE"
                    interactions.append({
                        "drugs": [drug1, drug2],
                        "severity": severity,
                        "reason": reason
                    })
        
        return jsonify({
            "status": "success",
            "interaction_count": len(interactions),
            "interactions": interactions,
            "safety_score": max(0, 100 - (len(interactions) * 25))
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/ocr', methods=['POST'])
def ocr_prescription():
    """Analyze prescription image with Groq Vision only (no EasyOCR)."""
    try:
        if not groq_client:
            return jsonify({
                "status": "error",
                "message": "GROQ_API_KEY is not set. Add it to clinica-diff/ai-model/.env"
            }), 503

        image_data_url = None

        if 'image' in request.files:
            img_bytes = request.files['image'].read()
            if len(img_bytes) < 100:
                return jsonify({"status": "error", "message": "Image file is empty or corrupt"}), 400
            b64 = base64.b64encode(img_bytes).decode('utf-8')
            mime = request.files['image'].mimetype or 'image/png'
            image_data_url = f"data:{mime};base64,{b64}"
        elif request.is_json and request.json.get('image'):
            raw = request.json['image']
            if raw.startswith('data:'):
                image_data_url = raw
            else:
                image_data_url = f"data:image/png;base64,{re.sub(r'^data:image/\w+;base64,', '', raw)}"
        else:
            return jsonify({"status": "error", "message": "No image provided. Send as file upload or base64 JSON."}), 400

        print("[Prescription] Groq Vision analysis starting...")

        prompt = """You are a caring medical assistant helping patients understand their prescription.

Look at this prescription image carefully (handwritten or printed). Extract every medicine and explain everything in plain, simple English.

Return ONLY valid JSON (no markdown) with this exact structure:
{
  "raw_text": "all text you can read from the image",
  "drugs_found": ["Drug1", "Drug2"],
  "medications": [
    {
      "drug_name": "Medicine name as written",
      "generic_name": "Generic name if known, else same as drug_name",
      "dosage": "e.g. 500mg",
      "frequency": "e.g. Twice a day",
      "duration": "e.g. 5 days",
      "timing": "e.g. After meals",
      "form": "Tablet/Capsule/Syrup/etc",
      "instructions": "One short sentence the patient should remember",
      "layman_guide": {
        "what_is_this_medicine": "1-2 simple sentences: what this medicine is for",
        "how_to_take": [
          "Step 1: ...",
          "Step 2: ...",
          "Step 3: ..."
        ],
        "what_it_does_for_you": [
          "Bullet: how it helps your body",
          "Bullet: what symptom it targets"
        ],
        "side_effects_to_watch": [
          "Bullet: common mild side effect",
          "Bullet: when to call the doctor"
        ],
        "important_warnings": [
          "Bullet: food/alcohol/other medicine warnings"
        ]
      }
    }
  ],
  "patient_info": {
    "name": "if visible",
    "age": "if visible",
    "date": "if visible",
    "doctor_name": "if visible"
  },
  "diagnosis": "diagnosis written on prescription if any",
  "special_notes": "any warnings or notes",
  "has_doctor_signature": true,
  "disease_inference": {
    "primary_disease": "Most likely condition based on ALL medicines prescribed",
    "secondary_conditions": ["other possible conditions"],
    "confidence": "high|medium|low",
    "severity": "mild|moderate|high|critical",
    "patient_explanation": "2-3 sentences in very simple language explaining what illness the medicines suggest",
    "what_this_means": [
      "Bullet: what this condition is in simple words",
      "Bullet: why these medicines were chosen",
      "Bullet: what to expect while taking them",
      "Bullet: lifestyle tips",
      "Bullet: when to see doctor urgently"
    ],
    "doctor_alert": "Brief clinical note for the doctor",
    "urgency": "routine|follow_up|urgent|emergency",
    "follow_up_tests": ["suggested tests if any"],
    "hereditary_risk_diseases": []
  }
}

Rules:
- List EVERY medicine you can identify; one medications[] entry per medicine.
- layman_guide must be easy enough for a non-medical person (no jargon).
- how_to_take must be numbered steps (Step 1, Step 2, ...).
- disease_inference must be based on the combination of all medicines, not just one.
- If handwriting is unclear, make your best medical guess and note uncertainty in special_notes."""

        response = groq_client.chat.completions.create(
            model=GROQ_VISION_MODEL,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_data_url}}
                ]
            }],
            temperature=0.15,
            max_tokens=4096,
        )

        data = parse_groq_json(response.choices[0].message.content)
        meds = data.get("medications", []) or []
        drugs_found = data.get("drugs_found", []) or [m.get("drug_name") for m in meds if m.get("drug_name")]
        disease_inference = data.get("disease_inference", {})
        has_sig = data.get("has_doctor_signature", False)

        print(f"[Prescription] Groq Vision OK — {len(meds)} medicines, disease: {disease_inference.get('primary_disease', 'N/A')}")

        return jsonify({
            "status": "success",
            "raw_text": data.get("raw_text", ""),
            "cleaned_text": data.get("raw_text", ""),
            "expanded_text": data.get("raw_text", ""),
            "drugs_found": drugs_found,
            "medications": meds,
            "patient_info": data.get("patient_info", {}),
            "diagnosis": data.get("diagnosis", ""),
            "special_notes": data.get("special_notes", ""),
            "abbreviations_found": [],
            "patient_summary": build_patient_summary_from_meds(meds),
            "disease_inference": disease_inference,
            "text_blocks_count": len(meds),
            "engine": "groq_vision",
            "trust_ledger": {
                "signature_detected": has_sig,
                "verification_status": "VERIFIED" if has_sig else "UNVERIFIED",
                "timestamp": "Real-time"
            }
        })

    except json.JSONDecodeError as e:
        print(f"[Prescription] JSON parse error: {e}")
        return jsonify({"status": "error", "message": "AI returned invalid format. Please try again with a clearer photo."}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        err = str(e)
        if 'api_key' in err.lower() or '401' in err:
            return jsonify({"status": "error", "message": "Invalid GROQ_API_KEY. Check ai-model/.env"}), 503
        return jsonify({"status": "error", "message": err}), 500


@app.route('/calculate-hereditary-risk', methods=['POST'])
def calculate_hereditary_risk():
    """Calculate personal genetic risk — supports both manual family history AND auto-inference from prescription drugs."""
    try:
        data = request.json
        family_members = data.get('family_members', [])
        drugs_found = [d.lower() for d in data.get('drugs_found', [])]
        inferred_diseases = data.get('inferred_diseases', [])
        
        calculated_risks = {}
        
        # --- MODE 1: Manual family history ---
        for member in family_members:
            relation = member.get('relation', '').lower()
            condition = member.get('condition', '')
            if condition in HEREDITARY_DB:
                base_risk = HEREDITARY_DB[condition]['risk_multiplier'].get(relation, 0.05)
                if condition not in calculated_risks:
                    calculated_risks[condition] = {
                        "risk_score": 0,
                        "prevention": HEREDITARY_DB[condition]['prevention'],
                        "warning_signs": HEREDITARY_DB[condition].get('warning_signs', []),
                        "affected_relatives": [],
                        "source": "family_history"
                    }
                calculated_risks[condition]["risk_score"] = min(0.95, calculated_risks[condition]["risk_score"] + base_risk)
                calculated_risks[condition]["affected_relatives"].append(relation.title())

        # --- MODE 2: Auto-infer from prescription drugs ---
        for drug in drugs_found:
            disease = DRUG_TO_DISEASE_MAP.get(drug)
            if disease and disease in HEREDITARY_DB:
                if disease not in calculated_risks:
                    # Base personal risk = 25% (patient is already on medication for this)
                    calculated_risks[disease] = {
                        "risk_score": 0.25,
                        "prevention": HEREDITARY_DB[disease]['prevention'],
                        "warning_signs": HEREDITARY_DB[disease].get('warning_signs', []),
                        "affected_relatives": [],
                        "source": "prescription",
                        "triggering_drug": drug.title()
                    }
                else:
                    # Already exists from family history — boost by prescription evidence
                    calculated_risks[disease]["risk_score"] = min(0.95, calculated_risks[disease]["risk_score"] + 0.1)
                    calculated_risks[disease]["source"] = "combined"
        
        # --- MODE 3: From AI-inferred diseases (prescription disease inference) ---
        for disease_name in inferred_diseases:
            if disease_name in HEREDITARY_DB and disease_name not in calculated_risks:
                calculated_risks[disease_name] = {
                    "risk_score": 0.20,
                    "prevention": HEREDITARY_DB[disease_name]['prevention'],
                    "warning_signs": HEREDITARY_DB[disease_name].get('warning_signs', []),
                    "affected_relatives": [],
                    "source": "ai_inferred"
                }

        # If no data provided at all, return all known conditions with a base low risk profile
        if not calculated_risks and not family_members and not drugs_found and not inferred_diseases:
            for condition, info in list(HEREDITARY_DB.items())[:8]:
                calculated_risks[condition] = {
                    "risk_score": 0.05,
                    "prevention": info['prevention'],
                    "warning_signs": info.get('warning_signs', []),
                    "affected_relatives": [],
                    "source": "baseline"
                }

        # Format output
        results = []
        for cond, info in calculated_risks.items():
            source_label = {
                "family_history": "Family History",
                "prescription": "Prescription Detected",
                "combined": "Family + Prescription",
                "ai_inferred": "AI Inferred",
                "baseline": "Baseline Population Risk"
            }.get(info.get('source', 'baseline'), 'Assessed')
            
            results.append({
                "condition": cond,
                "risk_percentage": round(info["risk_score"] * 100, 1),
                "prevention_tips": info["prevention"],
                "warning_signs": info.get("warning_signs", []),
                "relatives": info.get("affected_relatives", []),
                "source": info.get("source", "baseline"),
                "source_label": source_label,
                "triggering_drug": info.get("triggering_drug", None)
            })
            
        results.sort(key=lambda x: x["risk_percentage"], reverse=True)
        
        overall = "High" if any(r['risk_percentage'] > 50 for r in results) else "Moderate" if any(r['risk_percentage'] > 20 for r in results) else "Low"
        
        return jsonify({
            "status": "success",
            "risks": results,
            "overall_genetic_profile": overall,
            "total_conditions_assessed": len(results),
            "modes_used": list(set([r['source'] for r in results]))
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/infer-disease-from-prescription', methods=['POST'])
def infer_disease_from_prescription():
    """Use Gemini to infer what disease(s) a patient has based on their prescribed medications."""
    try:
        data = request.json
        drugs_found = data.get('drugs_found', [])
        medications = data.get('medications', [])
        diagnosis_text = data.get('diagnosis', '')
        
        if not drugs_found and not medications and not diagnosis_text:
            return jsonify({"status": "error", "message": "No prescription data provided"}), 400

        # Build a structured med list for the prompt
        med_lines = []
        for med in medications:
            line = f"- {med.get('drug_name', 'Unknown')} {med.get('dosage', '')} ({med.get('frequency', '')})"
            if med.get('instructions'):
                line += f": {med['instructions']}"
            med_lines.append(line)
        
        if not med_lines and drugs_found:
            med_lines = [f"- {d}" for d in drugs_found]

        med_text = "\n".join(med_lines)
        diag_text = f"\nDiagnosis noted on prescription: {diagnosis_text}" if diagnosis_text else ""
        
        if groq_client:
            try:
                prompt = f"""You are a senior medical AI. A patient has been prescribed the following medications:

{med_text}{diag_text}

Based on these medications, provide a comprehensive medical analysis. Respond ONLY with valid raw JSON (NO markdown wrappers):
{{
    "primary_disease": "The most likely primary condition being treated",
    "secondary_conditions": ["Any secondary conditions suggested by the combination of drugs"],
    "confidence": "high|medium|low",
    "severity": "mild|moderate|high|critical",
    "patient_explanation": "A clear, simple 2-3 sentence explanation of what condition the patient is likely being treated for, written in plain language a patient can understand.",
    "what_this_means": [
        "Point 1: What this condition is",
        "Point 2: How the medications help",
        "Point 3: What the patient should watch for",
        "Point 4: Lifestyle advice",
        "Point 5: When to see the doctor urgently"
    ],
    "doctor_alert": "A brief clinical summary for the treating doctor — include the inferred condition, rationale, and any drug combination concerns.",
    "urgency": "routine|follow_up|urgent|emergency",
    "follow_up_tests": ["Recommended diagnostic tests or monitoring"],
    "hereditary_risk_diseases": ["List of condition names from this set that this prescription indicates risk for: Diabetes (Type 2), Hypertension, Heart Attack, Asthma, Thyroid Disease, Kidney Disease, Rheumatoid Arthritis, Osteoporosis, Depression, PCOS, Stroke, Colorectal Cancer, Alzheimer's Disease"]
}}"""
                
                response = groq_client.chat.completions.create(
                    model=GROQ_TEXT_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                    max_tokens=1024,
                )
                result = parse_groq_json(response.choices[0].message.content)
                
                return jsonify({
                    "status": "success",
                    "engine": "groq",
                    **result
                })
            except Exception as e:
                print(f"[Inference] Groq failed: {e}. Using fallback.")
        
        # --- Fallback: rule-based inference from DRUG_TO_DISEASE_MAP ---
        inferred = {}
        for drug in [d.lower() for d in drugs_found]:
            disease = DRUG_TO_DISEASE_MAP.get(drug)
            if disease:
                inferred[disease] = inferred.get(disease, 0) + 1
        
        primary = max(inferred, key=inferred.get) if inferred else "Unspecified Condition"
        secondary = [d for d in inferred if d != primary]
        
        return jsonify({
            "status": "success",
            "engine": "rule_based",
            "primary_disease": primary,
            "secondary_conditions": secondary,
            "confidence": "medium" if len(inferred) > 1 else "low",
            "severity": "moderate",
            "patient_explanation": f"Based on your prescription, you appear to be receiving treatment for {primary}. Please consult your doctor for a detailed explanation.",
            "what_this_means": [
                f"You are being treated for: {primary}",
                "Take your medications as prescribed",
                "Report any new or worsening symptoms to your doctor",
                "Maintain a healthy lifestyle",
                "Keep all follow-up appointments"
            ],
            "doctor_alert": f"Prescription analysis suggests patient is being treated for {primary}. Drugs found: {', '.join(drugs_found)}.",
            "urgency": "routine",
            "follow_up_tests": ["Consult your doctor for appropriate follow-up tests"],
            "hereditary_risk_diseases": [primary] if primary in HEREDITARY_DB else []
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


def _image_data_url_from_request():
    """Extract image data URL from multipart or JSON body."""
    if 'image' in request.files:
        img_bytes = request.files['image'].read()
        if len(img_bytes) < 100:
            return None, "Image file is empty or corrupt"
        b64 = base64.b64encode(img_bytes).decode('utf-8')
        mime = request.files['image'].mimetype or 'image/jpeg'
        return f"data:{mime};base64,{b64}", None
    if request.is_json and request.json.get('image'):
        raw = request.json['image']
        if raw.startswith('data:'):
            return raw, None
        return f"data:image/jpeg;base64,{re.sub(r'^data:image/\w+;base64,', '', raw)}", None
    return None, "No image provided"


@app.route('/multimodal-diagnose', methods=['POST'])
def multimodal_diagnose():
    """Photo + text symptom fusion (rash, wound, eye, skin, etc.)."""
    try:
        if not groq_client:
            return jsonify({"status": "error", "message": "GROQ_API_KEY not configured"}), 503

        image_url, err = _image_data_url_from_request()
        if err:
            return jsonify({"status": "error", "message": err}), 400

        symptoms_text = (request.json or {}).get('symptoms', '') if request.is_json else request.form.get('symptoms', '')
        age = (request.json or {}).get('age') if request.is_json else request.form.get('age')

        prompt = f"""You are a multimodal clinical AI. Analyze this medical image TOGETHER with the patient's description.

Patient description: \"\"\"{symptoms_text or 'No additional text provided'}\"\"\"
{f'Patient age: {age}' if age else ''}

Return ONLY valid JSON:
{{
  "visual_findings": ["bullet: what you see in the image"],
  "image_type": "rash|wound|eye|skin|swelling|other",
  "clinical_summary": "2-3 sentences combining image + symptoms",
  "urgency_level": "routine|soon|urgent|emergency",
  "emergency_now": false,
  "recommended_specialist": "Dermatologist / etc",
  "predictions": [
    {{
      "disease": "condition name",
      "confidence": 0.75,
      "severity": "mild|moderate|high|critical",
      "body_part": "body system",
      "disease_category": "dermatological|etc",
      "matched_symptoms": ["from text or image"],
      "layman_explanation": "simple explanation",
      "immediate_action": "what to do now",
      "watch_out_for": ["red flag 1", "red flag 2"]
    }}
  ],
  "home_care_steps": ["safe step 1", "step 2"],
  "when_to_seek_emergency": ["red flag"],
  "questions_for_doctor": ["question 1", "question 2"]
}}

Return 5-8 predictions sorted by confidence. Be specific about visual features (color, size, pattern, location)."""

        response = groq_client.chat.completions.create(
            model=GROQ_VISION_MODEL,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            }],
            temperature=0.15,
            max_tokens=4096,
        )
        data = parse_groq_json(response.choices[0].message.content)
        preds = [normalize_symptom_prediction(p) for p in (data.get('predictions') or [])]
        preds.sort(key=lambda x: x['confidence'], reverse=True)

        return jsonify({
            "status": "success",
            "engine": "groq_vision_multimodal",
            "visual_findings": data.get('visual_findings', []),
            "image_type": data.get('image_type', 'other'),
            "clinical_summary": data.get('clinical_summary', ''),
            "urgency_level": data.get('urgency_level', 'routine'),
            "emergency_now": bool(data.get('emergency_now', False)),
            "recommended_specialist": data.get('recommended_specialist', ''),
            "predictions": preds,
            "home_care_steps": data.get('home_care_steps', []),
            "when_to_seek_emergency": data.get('when_to_seek_emergency', []),
            "questions_for_doctor": data.get('questions_for_doctor', []),
            "symptoms_raw": symptoms_text,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/scan-medicine', methods=['POST'])
def scan_medicine():
    """AR-style medicine strip/box scanner via Groq Vision."""
    try:
        if not groq_client:
            return jsonify({"status": "error", "message": "GROQ_API_KEY not configured"}), 503

        image_url, err = _image_data_url_from_request()
        if err:
            return jsonify({"status": "error", "message": err}), 400

        prompt = """Analyze this medicine packaging, strip, bottle, or label image.

Return ONLY valid JSON:
{
  "medicine_name": "brand or visible name",
  "generic_name": "generic/chemical name if known",
  "strength": "e.g. 500mg",
  "form": "tablet/capsule/syrup/injection",
  "manufacturer": "if visible",
  "expiry_visible": "date if visible or unknown",
  "identified": true,
  "layman_guide": {
    "what_is_this_medicine": "simple 1-2 sentences",
    "how_to_take": ["Step 1", "Step 2", "Step 3"],
    "what_it_does_for_you": ["bullet 1", "bullet 2"],
    "side_effects_to_watch": ["bullet 1", "bullet 2"],
    "important_warnings": ["bullet 1"]
  },
  "likely_used_for": ["condition 1", "condition 2"],
  "interaction_warnings": ["warning if common interactions known"],
  "confidence": "high|medium|low"
}

If not a medicine or unreadable, set identified: false and explain in what_is_this_medicine."""

        response = groq_client.chat.completions.create(
            model=GROQ_VISION_MODEL,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            }],
            temperature=0.15,
            max_tokens=2048,
        )
        data = parse_groq_json(response.choices[0].message.content)
        return jsonify({"status": "success", "engine": "groq_vision_scanner", **data})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/doctor-copilot-brief', methods=['POST'])
def doctor_copilot_brief():
    """Generate 1-page clinical brief for treating physician."""
    try:
        if not groq_client:
            return jsonify({"status": "error", "message": "GROQ_API_KEY not configured"}), 503

        data = request.json or {}
        patient_name = data.get('patientName', 'Patient')
        brief_type = data.get('type', 'symptom')  # symptom | prescription | multimodal
        symptoms = data.get('symptoms', '')
        predictions = data.get('predictions', [])
        medications = data.get('medications', [])
        diagnosis = data.get('diagnosis', '')
        visual_findings = data.get('visual_findings', [])
        urgency = data.get('urgency_level', 'routine')

        pred_lines = "\n".join(
            f"- {p.get('disease')} ({int(float(p.get('confidence', 0.5)) * 100)}%, {p.get('severity')})"
            for p in predictions[:8]
        ) or "None provided"
        med_lines = "\n".join(
            f"- {m.get('drug_name', m)} {m.get('dosage', '')}"
            for m in medications[:15]
        ) if medications else "None"

        prompt = f"""Generate a concise clinical copilot brief for Dr. treating {patient_name}.
Case type: {brief_type}
Urgency: {urgency}

Symptoms/notes: {symptoms}
AI top differentials:
{pred_lines}
Medications: {med_lines}
Diagnosis on record: {diagnosis or 'N/A'}
Visual findings: {', '.join(visual_findings) if visual_findings else 'N/A'}

Return ONLY valid JSON:
{{
  "headline": "one-line case summary for doctor",
  "urgency": "routine|soon|urgent|emergency",
  "primary_concern": "main clinical concern",
  "differential_diagnosis": ["dx1", "dx2", "dx3"],
  "red_flags": ["flag 1", "flag 2"],
  "suggested_tests": ["test 1", "test 2"],
  "treatment_considerations": ["point 1", "point 2"],
  "drug_interaction_notes": ["note if any"],
  "follow_up_plan": "recommended follow-up",
  "patient_talking_points": ["what to discuss with patient"],
  "confidence_note": "brief note on AI confidence/limitations"
}}"""

        response = groq_client.chat.completions.create(
            model=GROQ_TEXT_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert clinical copilot assisting licensed physicians. Be precise and actionable."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=2048,
        )
        brief = parse_groq_json(response.choices[0].message.content)
        return jsonify({
            "status": "success",
            "engine": "groq_copilot",
            "patientName": patient_name,
            "type": brief_type,
            "timestamp": __import__('datetime').datetime.utcnow().isoformat() + 'Z',
            **brief,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/adherence/generate-schedule', methods=['POST'])
def generate_adherence_schedule():
    """Build daily medication adherence schedule from prescription meds."""
    try:
        if not groq_client:
            return jsonify({"status": "error", "message": "GROQ_API_KEY not configured"}), 503

        medications = (request.json or {}).get('medications', [])
        if not medications:
            return jsonify({"status": "error", "message": "No medications provided"}), 400

        med_json = json.dumps(medications, indent=2)
        prompt = f"""Create a 7-day medication adherence schedule for a patient.

Medications:
{med_json}

Return ONLY valid JSON:
{{
  "schedule_title": "Your Medicine Schedule",
  "daily_reminders": [
    {{
      "drug_name": "name",
      "time": "08:00",
      "time_label": "8:00 AM — After breakfast",
      "dosage": "500mg",
      "instruction": "short reminder in friendly language",
      "icon": "morning|afternoon|evening|night"
    }}
  ],
  "weekly_tips": ["tip 1", "tip 2", "tip 3"],
  "missed_dose_advice": "what to do if a dose is missed",
  "streak_message": "motivational message about consistency"
}}

Include ALL medicines. Use realistic times (morning/afternoon/evening). Sort by time ascending."""

        response = groq_client.chat.completions.create(
            model=GROQ_TEXT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=2048,
        )
        schedule = parse_groq_json(response.choices[0].message.content)
        return jsonify({"status": "success", "engine": "groq", **schedule})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/detect-outbreaks', methods=['POST'])
def detect_outbreaks():
    """Simulate detection of localized outbreaks based on symptom clusters."""
    try:
        data = request.json
        city = data.get('city', 'Local Area')
        current_symptoms = data.get('symptoms', [])
        
        # Simulated "Historical" cluster data for the demo
        # In a real app, this would query the DB for other users in the same city
        mock_clusters = [
            {"city": "Mumbai", "symptoms": ["fever", "joint pain", "rash"], "disease": "Dengue", "count": 12},
            {"city": "Delhi", "symptoms": ["cough", "difficulty breathing", "fatigue"], "disease": "Pneumonia/Pollution", "count": 45},
            {"city": "Bangalore", "symptoms": ["diarrhea", "stomach pain", "vomiting"], "disease": "Gastroenteritis", "count": 8}
        ]
        
        # Find matching cluster
        found_outbreak = None
        for cluster in mock_clusters:
            if cluster['city'].lower() == city.lower():
                # Check if current symptoms overlap with cluster
                overlap = set(current_symptoms) & set(cluster['symptoms'])
                if len(overlap) >= 1:
                    found_outbreak = {
                        "disease": cluster['disease'],
                        "severity": "high" if cluster['count'] > 10 else "moderate",
                        "active_cases": cluster['count'],
                        "overlap": list(overlap),
                        "recommendation": f"A localized trend of {cluster['disease']} detected. Use preventive measures."
                    }
                    break
        
        return jsonify({
            "status": "success",
            "city": city,
            "outbreak_detected": found_outbreak is not None,
            "outbreak_data": found_outbreak
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "online",
        "service": "Clinica-Diff AI Engine v2.0",
        "diseases_loaded": len(DISEASE_DB),
        "drugs_in_database": len(DRUG_NAMES),
        "abbreviations_loaded": len(ABBREVIATIONS),
        "groq_vision_ready": groq_client is not None,
        "vision_model": GROQ_VISION_MODEL,
    })


if __name__ == '__main__':
    print(f"[AI] Clinica-Diff AI Engine v2.0")
    print(f"   Diseases: {len(DISEASE_DB)}")
    print(f"   Drug names: {len(DRUG_NAMES)}")
    print(f"   Abbreviations: {len(ABBREVIATIONS)}")
    print(f"   Symptom synonyms: {len(SYMPTOM_SYNONYMS)}")
    app.run(port=5001, debug=True)
