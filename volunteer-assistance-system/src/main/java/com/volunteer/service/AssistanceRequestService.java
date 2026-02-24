package com.volunteer.service;

import com.volunteer.dto.AssistanceRequestResponse;
import com.volunteer.dto.VolunteerMatch;
import com.volunteer.exception.ResourceNotFoundException;
import com.volunteer.model.AssistanceRequest;
import com.volunteer.model.RequestStatus;
import com.volunteer.model.Volunteer;
import com.volunteer.repository.AssistanceRequestRepository;
import com.volunteer.repository.VolunteerRepository;
import com.volunteer.utility.MatchingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssistanceRequestService {

    private final AssistanceRequestRepository requestRepository;
    private final VolunteerRepository volunteerRepository;
    private final MatchingService matchingService;

    /**
     * Create a new assistance request with top 3 suggested volunteers
     */
    public AssistanceRequestResponse createRequest(AssistanceRequest request) {
        log.info("Creating new assistance request from: {}", request.getRequesterName());

        // Save the request
        AssistanceRequest savedRequest = requestRepository.save(request);

        // Get top 3 suggested volunteers
        List<VolunteerMatch> suggestedVolunteers = matchingService.getTop3Volunteers(savedRequest);

        log.info("Found {} suggested volunteers for request {}",
                suggestedVolunteers.size(), savedRequest.getId());

        return new AssistanceRequestResponse(savedRequest, suggestedVolunteers);
    }

    /**
     * Get all assistance requests
     */
    public List<AssistanceRequest> getAllRequests() {
        log.info("Fetching all assistance requests");
        return requestRepository.findAll();
    }

    /**
     * Get assistance request by ID
     */
    public AssistanceRequest getRequestById(Long id) {
        log.info("Fetching assistance request with ID: {}", id);
        return requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assistance request not found with id: " + id));
    }

    /**
     * Update request status
     */
    public AssistanceRequest updateRequestStatus(Long id, RequestStatus status) {
        log.info("Updating status of request {} to {}", id, status);

        AssistanceRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assistance request not found with id: " + id));

        request.setStatus(status);
        return requestRepository.save(request);
    }

    /**
     * Assign volunteer to a request
     */
    public AssistanceRequest assignVolunteer(Long requestId, Long volunteerId) {
        log.info("Assigning volunteer {} to request {}", volunteerId, requestId);

        // Validate request exists
        AssistanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Assistance request not found with id: " + requestId));

        // Validate volunteer exists and is active
        Volunteer volunteer = volunteerRepository.findById(volunteerId)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer not found with id: " + volunteerId));

        if (!volunteer.isActive()) {
            throw new IllegalStateException("Cannot assign inactive volunteer");
        }

        // Assign volunteer and update status
        request.setAssignedVolunteerId(volunteerId);
        request.setStatus(RequestStatus.ASSIGNED);

        return requestRepository.save(request);
    }

    /**
     * Delete assistance request
     */
    public void deleteRequest(Long id) {
        log.info("Deleting assistance request with ID: {}", id);

        AssistanceRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assistance request not found with id: " + id));

        requestRepository.delete(request);
    }

    /**
     * Get requests by status
     */
    public List<AssistanceRequest> getRequestsByStatus(RequestStatus status) {
        log.info("Fetching requests with status: {}", status);
        return requestRepository.findByStatus(status);
    }
}
