package com.volunteer.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenAPIConfig {

    @Bean
    public OpenAPI volunteerAssistanceAPI() {
        Server localServer = new Server();
        localServer.setUrl("http://localhost:8080");
        localServer.setDescription("Local Development Server");

        Contact contact = new Contact();
        contact.setName("Volunteer Assistance System");
        contact.setEmail("support@volunteer-system.com");

        Info info = new Info()
                .title("Volunteer Assistance Coordination System API")
                .version("1.0.0")
                .description(
                        "REST API for coordinating volunteers with assistance requests using AI-based matching algorithm. "
                                +
                                "Features include volunteer management, assistance request handling, and intelligent volunteer-request matching.")
                .contact(contact);

        return new OpenAPI()
                .info(info)
                .servers(List.of(localServer));
    }
}
