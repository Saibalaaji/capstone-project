// CVAS — AI Intelligence Engine
// Simulates NLP interpretation, multi-factor matching, acceptance prediction, and adaptive learning

// ── Service type keywords for NLP extraction ──
const SERVICE_KEYWORDS = {
    'Food Delivery': ['food', 'grocery', 'meal', 'deliver', 'hunger', 'nutrition', 'eat', 'cooking'],
    'Medical Assistance': ['medical', 'health', 'doctor', 'hospital', 'medicine', 'dialysis', 'therapy', 'clinic', 'nurse', 'prescription'],
    'Home Repair': ['repair', 'fix', 'plumbing', 'roof', 'leak', 'broken', 'maintenance', 'electrical', 'paint'],
    'Transportation': ['transport', 'ride', 'drive', 'pick up', 'drop off', 'commute', 'travel', 'vehicle', 'car'],
    'Elder Care': ['elder', 'elderly', 'senior', 'companion', 'caregiver', 'aging', 'old age', 'widow', 'retired'],
    'Cleaning': ['clean', 'housekeeping', 'sweep', 'mop', 'tidy', 'sanitation', 'wash', 'organize'],
};

const URGENCY_KEYWORDS = {
    HIGH: ['urgent', 'emergency', 'critical', 'immediately', 'asap', 'severe', 'critical', 'life-threatening'],
    MEDIUM: ['soon', 'moderate', 'needed', 'weekly', 'regular', 'important'],
    LOW: ['whenever', 'no rush', 'optional', 'flexible', 'casual', 'light'],
};

const LOCATION_KEYWORDS = ['new york', 'los angeles', 'chicago', 'san francisco', 'houston', 'seattle', 'boston', 'miami'];

// ── 1. Request Understanding AI — NLP Interpretation ──
export function interpretRequest(description) {
    const text = description.toLowerCase();

    // Extract service type
    let detectedServiceType = null;
    let maxKeywordHits = 0;
    for (const [type, keywords] of Object.entries(SERVICE_KEYWORDS)) {
        const hits = keywords.filter(k => text.includes(k)).length;
        if (hits > maxKeywordHits) {
            maxKeywordHits = hits;
            detectedServiceType = type;
        }
    }

    // Extract urgency
    let detectedUrgency = 'MEDIUM';
    for (const [level, keywords] of Object.entries(URGENCY_KEYWORDS)) {
        if (keywords.some(k => text.includes(k))) {
            detectedUrgency = level;
            break;
        }
    }

    // Extract location
    let detectedLocation = null;
    for (const loc of LOCATION_KEYWORDS) {
        if (text.includes(loc)) {
            detectedLocation = loc.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            break;
        }
    }

    // Extract skills
    const extractedSkills = [];
    for (const [type, keywords] of Object.entries(SERVICE_KEYWORDS)) {
        if (keywords.some(k => text.includes(k))) {
            extractedSkills.push(type);
        }
    }

    return {
        service_type: detectedServiceType,
        urgency_level: detectedUrgency,
        location: detectedLocation,
        required_skills: extractedSkills,
        confidence: Math.min(0.95, 0.4 + maxKeywordHits * 0.15),
        nlp_tokens: text.split(/\s+/).length,
    };
}

// ── 2. Volunteer Matching AI — Enhanced Multi-Factor Scoring ──
const WEIGHTS = {
    availability: 0.25,
    location: 0.20,
    skill: 0.25,
    performance: 0.15,
    acceptance: 0.15,
};

function computeAvailabilityScore(volunteer) {
    if (!volunteer.availableDays || volunteer.availableDays.length === 0) return 0;
    return Math.min(1.0, volunteer.availableDays.length / 5);
}

function computeProximityScore(requestLocation, volunteerLocation) {
    if (!requestLocation || !volunteerLocation) return 0;
    if (requestLocation.toLowerCase() === volunteerLocation.toLowerCase()) return 1.0;
    if (requestLocation.toLowerCase().includes(volunteerLocation.toLowerCase()) ||
        volunteerLocation.toLowerCase().includes(requestLocation.toLowerCase())) return 0.5;
    return 0.0;
}

function computeSkillMatchScore(requestServiceType, volunteerServiceTypes) {
    if (!volunteerServiceTypes || volunteerServiceTypes.length === 0) return 0;
    const exact = volunteerServiceTypes.some(s => s.toLowerCase() === requestServiceType.toLowerCase());
    if (exact) return 1.0;
    const partial = volunteerServiceTypes.some(s =>
        s.toLowerCase().includes(requestServiceType.toLowerCase()) ||
        requestServiceType.toLowerCase().includes(s.toLowerCase())
    );
    return partial ? 0.5 : 0.0;
}

function computeReliabilityScore(volunteer) {
    return Math.min(volunteer.rating / 5.0, 1.0);
}

// ── 3. Acceptance Prediction Model ──
export function predictAcceptanceProbability(volunteer, _request) {
    // Simulate using past acceptance rate, response time, and workload
    const baseAcceptance = 0.65;
    const ratingBonus = (volunteer.rating / 5.0) * 0.20;
    const availabilityBonus = volunteer.availableDays && volunteer.availableDays.length > 3 ? 0.10 : 0;
    const activeBonus = volunteer.active ? 0.05 : -0.30;

    // Randomize slightly for demo realism
    const jitter = (Math.random() - 0.5) * 0.08;

    return Math.min(0.98, Math.max(0.15, baseAcceptance + ratingBonus + availabilityBonus + activeBonus + jitter));
}

// ── Full Match Score Computation ──
export function computeMatchScore(volunteer, request) {
    const availabilityScore = computeAvailabilityScore(volunteer);
    const proximityScore = computeProximityScore(request.location, volunteer.location);
    const skillScore = computeSkillMatchScore(request.serviceType, volunteer.serviceType);
    const reliabilityScore = computeReliabilityScore(volunteer);
    const acceptanceProbability = predictAcceptanceProbability(volunteer, request);

    const totalScore =
        WEIGHTS.availability * availabilityScore +
        WEIGHTS.location * proximityScore +
        WEIGHTS.skill * skillScore +
        WEIGHTS.performance * reliabilityScore +
        WEIGHTS.acceptance * acceptanceProbability;

    return {
        totalScore: Math.round(totalScore * 100) / 100,
        breakdown: {
            availability: { score: availabilityScore, weight: WEIGHTS.availability, weighted: Math.round(availabilityScore * WEIGHTS.availability * 100) / 100 },
            proximity: { score: proximityScore, weight: WEIGHTS.location, weighted: Math.round(proximityScore * WEIGHTS.location * 100) / 100 },
            skillMatch: { score: skillScore, weight: WEIGHTS.skill, weighted: Math.round(skillScore * WEIGHTS.skill * 100) / 100 },
            reliability: { score: reliabilityScore, weight: WEIGHTS.performance, weighted: Math.round(reliabilityScore * WEIGHTS.performance * 100) / 100 },
            acceptance: { score: Math.round(acceptanceProbability * 100) / 100, weight: WEIGHTS.acceptance, weighted: Math.round(acceptanceProbability * WEIGHTS.acceptance * 100) / 100 },
        },
        acceptanceProbability: Math.round(acceptanceProbability * 100) / 100,
    };
}

// ── Rank Volunteers for a Request ──
export function rankVolunteers(volunteers, request) {
    return volunteers
        .map(volunteer => {
            const scoring = computeMatchScore(volunteer, request);
            return { volunteer, ...scoring };
        })
        .sort((a, b) => b.totalScore - a.totalScore);
}

// ── 4. Adaptive Learning Engine ──
let learningLog = [];

export function recordOutcome(volunteerId, requestId, outcome) {
    // outcome: 'completed', 'declined', 'no_response'
    learningLog.push({
        volunteerId,
        requestId,
        outcome,
        timestamp: new Date().toISOString(),
    });
    return learningLog;
}

export function getAdaptiveSuggestions() {
    const byVolunteer = {};
    learningLog.forEach(log => {
        if (!byVolunteer[log.volunteerId]) byVolunteer[log.volunteerId] = { completed: 0, declined: 0, noResponse: 0 };
        if (log.outcome === 'completed') byVolunteer[log.volunteerId].completed++;
        if (log.outcome === 'declined') byVolunteer[log.volunteerId].declined++;
        if (log.outcome === 'no_response') byVolunteer[log.volunteerId].noResponse++;
    });

    return {
        learningLog,
        volunteerPerformance: byVolunteer,
        totalOutcomes: learningLog.length,
        successRate: learningLog.length > 0
            ? learningLog.filter(l => l.outcome === 'completed').length / learningLog.length
            : 0,
    };
}

export function clearLearningLog() {
    learningLog = [];
}
