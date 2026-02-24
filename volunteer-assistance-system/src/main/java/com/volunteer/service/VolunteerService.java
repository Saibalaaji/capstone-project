package com.volunteer.service;

import com.volunteer.exception.ResourceNotFoundException;
import com.volunteer.model.Volunteer;
import com.volunteer.repository.VolunteerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class VolunteerService {

    private final VolunteerRepository volunteerRepository;

    /**
     * Create a new volunteer
     */
    public Volunteer createVolunteer(Volunteer volunteer) {
        log.info("Creating new volunteer: {}", volunteer.getName());
        return volunteerRepository.save(volunteer);
    }

    /**
     * Update an existing volunteer
     */
    public Volunteer updateVolunteer(Long id, Volunteer volunteerDetails) {
        log.info("Updating volunteer with ID: {}", id);

        Volunteer volunteer = volunteerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer not found with id: " + id));

        volunteer.setName(volunteerDetails.getName());
        volunteer.setEmail(volunteerDetails.getEmail());
        volunteer.setPhone(volunteerDetails.getPhone());
        volunteer.setLocation(volunteerDetails.getLocation());
        volunteer.setAvailableDays(volunteerDetails.getAvailableDays());
        volunteer.setServiceType(volunteerDetails.getServiceType());
        volunteer.setRating(volunteerDetails.getRating());
        volunteer.setActive(volunteerDetails.isActive());

        return volunteerRepository.save(volunteer);
    }

    /**
     * Get all volunteers
     */
    public List<Volunteer> getAllVolunteers() {
        log.info("Fetching all volunteers");
        return volunteerRepository.findAll();
    }

    /**
     * Get volunteer by ID
     */
    public Volunteer getVolunteerById(Long id) {
        log.info("Fetching volunteer with ID: {}", id);
        return volunteerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer not found with id: " + id));
    }

    /**
     * Delete volunteer
     */
    public void deleteVolunteer(Long id) {
        log.info("Deleting volunteer with ID: {}", id);

        Volunteer volunteer = volunteerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer not found with id: " + id));

        volunteerRepository.delete(volunteer);
    }

    /**
     * Get all active volunteers
     */
    public List<Volunteer> getActiveVolunteers() {
        log.info("Fetching all active volunteers");
        return volunteerRepository.findByActiveTrue();
    }
}
