package com.volunteer.repository;

import com.volunteer.model.Volunteer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VolunteerRepository extends JpaRepository<Volunteer, Long> {

    List<Volunteer> findByActiveTrue();

    List<Volunteer> findByLocation(String location);

    List<Volunteer> findByServiceTypeContaining(String serviceType);
}
