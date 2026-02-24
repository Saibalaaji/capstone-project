package com.volunteer.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Entity
@Table(name = "volunteers")
public class Volunteer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Email(message = "Invalid email format")
    private String email;

    private String phone;

    private String location;

    @ElementCollection
    @CollectionTable(name = "volunteer_available_days", joinColumns = @JoinColumn(name = "volunteer_id"))
    @Column(name = "available_day")
    private List<String> availableDays = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "volunteer_service_types", joinColumns = @JoinColumn(name = "volunteer_id"))
    @Column(name = "service_type")
    private List<String> serviceType = new ArrayList<>();

    private double rating = 0.0;

    private boolean active = true;
}
