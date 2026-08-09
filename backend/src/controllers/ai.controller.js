const geminiService = require('../services/gemini.service');
const prisma = require('../config/prisma');

// 1. AI Symptom Checker (Patient Pre-Triage)
const symptomChecker = async (req, res, next) => {
  try {
    const { symptoms, duration, severity, age, gender } = req.body;

    const systemPrompt = `You are an AI Clinical Pre-Triage Assistant for iSHRMS Hospital.
Analyze the patient's symptoms and output a structured JSON object with key fields:
- "urgency": "Emergency" | "Urgent" | "Routine"
- "possibleConditions": Array of 3 likely medical conditions with brief reasons
- "recommendedDepartment": Name of hospital department (e.g. Cardiology, Neurology, Orthopedics, General Medicine)
- "triageScore": Score from 1 to 10 (10 = immediate emergency)
- "firstAidAdvice": Brief safety advice (NOT a formal diagnosis)
- "disclaimer": "This is an AI clinical pre-triage tool, not a doctor diagnosis. If experiencing severe chest pain or breathing difficulty, seek emergency care immediately."`;

    const userPrompt = `Patient Profile: Age ${age || 'Unknown'}, Gender ${gender || 'Unknown'}.
Reported Symptoms: ${Array.isArray(symptoms) ? symptoms.join(', ') : symptoms}.
Duration: ${duration || 'Not specified'}. Severity: ${severity || 'Moderate'}.`;

    const result = await geminiService.generateJSON(systemPrompt, userPrompt);
    res.status(200).json({ status: 'success', data: { triage: result } });
  } catch (error) {
    next(error);
  }
};

// 2. AI Diagnosis Assist (Doctor Consultation Co-Pilot)
const diagnosisAssist = async (req, res, next) => {
  try {
    const { vitals, symptoms, medicalHistory } = req.body;

    const systemPrompt = `You are an advanced AI Clinical Decision Support System (CDSS) for Doctors.
Given patient vitals, symptoms, and medical history, output JSON with:
- "differentialDiagnoses": Array of objects [{ "condition": "...", "confidence": "High/Medium/Low", "icd10Code": "...", "reasoning": "..." }]
- "recommendedLabTests": Array of suggested lab/radiology tests
- "warningFlags": Array of red-flag symptoms or vital abnormalities to watch out for`;

    const userPrompt = `Vitals: ${JSON.stringify(vitals || {})}.
Chief Complaints & Symptoms: ${symptoms}.
Medical History: ${medicalHistory || 'None'}.`;

    const result = await geminiService.generateJSON(systemPrompt, userPrompt);
    res.status(200).json({ status: 'success', data: { assist: result } });
  } catch (error) {
    next(error);
  }
};

// 3. AI Drug Interaction Checker (Pharmacy & Prescriptions)
const drugInteractionCheck = async (req, res, next) => {
  try {
    const { medicines } = req.body; // Array of medicine names

    const systemPrompt = `You are an AI Clinical Pharmacist. Analyze the list of medicines for potential drug-drug interactions, contraindications, and allergen warnings.
Output JSON with:
- "hasInteractions": boolean
- "severity": "High" | "Moderate" | "Minor" | "None"
- "interactions": Array of [{ "drug1": "...", "drug2": "...", "severity": "...", "mechanism": "...", "recommendation": "..." }]
- "generalPrecautions": Array of food/timing advice`;

    const userPrompt = `Medicine List: ${Array.isArray(medicines) ? medicines.join(', ') : medicines}.`;

    const result = await geminiService.generateJSON(systemPrompt, userPrompt);
    res.status(200).json({ status: 'success', data: { analysis: result } });
  } catch (error) {
    next(error);
  }
};

// 4. AI Discharge Summary Generator
const generateDischargeSummary = async (req, res, next) => {
  try {
    const { admissionId } = req.body;

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: {
        patient: true,
        department: true,
        doctor: true,
        bed: { include: { room: { include: { ward: true } } } }
      }
    });

    if (!admission) return res.status(404).json({ status: 'error', message: 'Admission record not found' });

    const systemPrompt = `You are a Medical Records AI. Generate a professional, structured clinical discharge summary for an inpatient.
Output JSON with:
- "patientName": string
- "uhid": string
- "admissionDate": string
- "dischargeDate": string
- "attendingDoctor": string
- "department": string
- "clinicalSummary": Concise paragraph of hospital stay
- "dischargeDiagnosis": string
- "dischargeMedications": Array of medications with dosage & duration
- "followUpInstructions": string
- "dietaryRestrictions": string`;

    const userPrompt = `Patient: ${admission.patient.name} (${admission.patient.uhid}), Age ${admission.patient.age}, Gender ${admission.patient.gender}.
Admitted On: ${admission.admittedAt}. Department: ${admission.department.name}. Attending Doctor: Dr. ${admission.doctor.firstName} ${admission.doctor.lastName}.
Bed: ${admission.bed?.label}, Ward: ${admission.bed?.room?.ward?.name}.`;

    const result = await geminiService.generateJSON(systemPrompt, userPrompt);
    res.status(200).json({ status: 'success', data: { summary: result } });
  } catch (error) {
    next(error);
  }
};

// 5. Staff AI Chatbot (Live Hospital Context NLP Assistant)
const staffChatbot = async (req, res, next) => {
  try {
    const { message } = req.body;

    // Fetch live hospital context metrics
    const [bedCount, totalBeds, waitingTokens, activeAlerts] = await Promise.all([
      prisma.bed.count({ where: { status: 'Available' } }),
      prisma.bed.count(),
      prisma.oPDToken.count({ where: { status: 'Waiting' } }),
      prisma.alert.count({ where: { status: 'Active' } })
    ]);

    const systemPrompt = `You are iSHRMS AI Assistant, an intelligent hospital co-pilot for doctors, nurses, and administrators.
Live Hospital Context:
- Available Beds: ${bedCount} / ${totalBeds} total beds.
- OPD Queue Waiting Patients: ${waitingTokens} patients.
- Active System Alerts: ${activeAlerts} alerts.

Respond concisely, accurately, and professionally to staff queries. Provide direct helpful medical or operational answers.`;

    const responseText = await geminiService.generateContent(systemPrompt, message);
    res.status(200).json({ status: 'success', data: { reply: responseText } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  symptomChecker,
  diagnosisAssist,
  drugInteractionCheck,
  generateDischargeSummary,
  staffChatbot
};
