package com.volunteer.utility;

import com.volunteer.dto.VolunteerMatch;
import com.volunteer.model.AssistanceRequest;
import com.volunteer.model.Volunteer;
import com.volunteer.repository.VolunteerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchingService {

    private final VolunteerRepository volunteerRepository;

    /**
     * Calculate match score between an assistance request and a volunteer
     * Scoring logic:
     * - Availability match (40%)
     * - Service type match (30%)
     * - Location match (20%)
     * - Rating weight (10%)
     */
    public double calculateMatchScore(AssistanceRequest request, Volunteer volunteer) {
        if (!volunteer.isActive()) {
            return 0.0;
        }

        double score = 0.0;

        // Service type match (30%)
        double serviceTypeScore = calculateServiceTypeMatch(request.getServiceType(), volunteer.getServiceType());
        score += serviceTypeScore * 0.30;

        // Location match (20%)
        double locationScore = calculateLocationMatch(request.getLocation(), volunteer.getLocation());
        score += locationScore * 0.20;

        // Availability match (40%) - Assuming requests can be fulfilled any day
        // For simplicity, we give full score if volunteer has any available days
        double availabilityScore = volunteer.getAvailableDays() != null && !volunteer.getAvailableDays().isEmpty() ? 1.0
                : 0.0;
        score += availabilityScore * 0.40;

        // Rating weight (10%) - Normalize rating to 0-1 scale (assuming max rating is
        // 5.0)
        double ratingScore = Math.min(volunteer.getRating() / 5.0, 1.0);
        score += ratingScore * 0.10;

        log.debug("Match score for volunteer {} and request {}: {}",
                volunteer.getId(), request.getId(), score);

        return score;
    }

    /**
     * Get top 3 volunteers for an assistance request based on match score
     */
    public List<VolunteerMatch> getTop3Volunteers(AssistanceRequest request) {
        List<Volunteer> allActiveVolunteers = volunteerRepository.findByActiveTrue();

        return allActiveVolunteers.stream()
                .map(volunteer -> new VolunteerMatch(volunteer, calculateMatchScore(request, volunteer)))
                .filter(match -> match.getMatchScore() > 0.0)
                .sorted((m1, m2) -> Double.compare(m2.getMatchScore(), m1.getMatchScore()))
                .limit(3)
                .collect(Collectors.toList());
    }

    /**
     * Calculate service type match score
     */
    private double calculateServiceTypeMatch(String requestedServiceType, List<String> volunteerServiceTypes) {
        if (volunteerServiceTypes == null || volunteerServiceTypes.isEmpty()) {
            return 0.0;
        }

        // Check if volunteer's service types contain the requested service type
        // (case-insensitive)
        boolean matches = volunteerServiceTypes.stream()
                .anyMatch(serviceType -> serviceType.equalsIgnoreCase(requestedServiceType));

        return matches ? 1.0 : 0.0;
    }

    /**
     * Calculate location match score
     */
    private double calculateLocationMatch(String requestLocation, String volunteerLocation) {
        if (requestLocation == null || volunteerLocation == null) {
            return 0.0;
        }

        // Exact match
        if (requestLocation.equalsIgnoreCase(volunteerLocation)) {
            return 1.0;
        }

        // Partial match (e.g., same city but different area)
        if (requestLocation.toLowerCase().contains(volunteerLocation.toLowerCase()) ||
                volunteerLocation.toLowerCase().contains(requestLocation.toLowerCase())) {
            return 0.5;
        }

        return 0.0;
    }
}
