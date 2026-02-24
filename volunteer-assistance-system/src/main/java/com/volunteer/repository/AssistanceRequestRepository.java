package com.volunteer.repository;

import com.volunteer.model.AssistanceRequest;
import com.volunteer.model.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssistanceRequestRepository extends JpaRepository<AssistanceRequest, Long> {

    List<AssistanceRequest> findByStatus(RequestStatus status);

    List<AssistanceRequest> findByAssignedVolunteerId(Long volunteerId);

    List<AssistanceRequest> findByLocation(String location);
}
