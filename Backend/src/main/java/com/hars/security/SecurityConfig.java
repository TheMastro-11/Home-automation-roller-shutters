package com.hars.security;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    private static final String ROUTINE_AGENT_HOSTNAME = "routineAgent";

    // Constructor injection
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/swagger-ui/**", "/actuator/health").permitAll() 
                .requestMatchers("/api/entities/routine/activate/*").access((authentication, context) -> {
                    String remoteIp = context.getRequest().getRemoteAddr();
                    boolean isRoutineAgentIp = false;
                    try {
                        InetAddress[] agentAddresses = InetAddress.getAllByName(ROUTINE_AGENT_HOSTNAME);
                        for (InetAddress agentAddr : agentAddresses) {
                            if (agentAddr.getHostAddress().equals(remoteIp)) {
                                isRoutineAgentIp = true;
                                log.debug("Allowed routineAgent access for path {} from IP {} (matches hostname {})",
                                          context.getRequest().getRequestURI(), remoteIp, ROUTINE_AGENT_HOSTNAME);
                                break;
                            }
                        }
                         if (!isRoutineAgentIp && agentAddresses.length > 0) {
                             log.trace("Denied routineAgent access for path {} from IP {}: Resolved IPs for {} were {}",
                                      context.getRequest().getRequestURI(), remoteIp, ROUTINE_AGENT_HOSTNAME, java.util.Arrays.toString(agentAddresses));
                        }
                    } catch (UnknownHostException e) {
                        log.warn("Could not resolve hostname '{}' to check IP for path {}: {}",
                                 ROUTINE_AGENT_HOSTNAME, context.getRequest().getRequestURI(), e.getMessage());
                    }
                    // Permetti accesso SOLO se l'IP corrisponde a quello di routineAgent
                    return new AuthorizationDecision(isRoutineAgentIp);
                })
                .anyRequest().authenticated() 
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS) 
            );

        // Add JWT filter
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOriginPatterns("*")
                        .allowedMethods("*")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600);
            }
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
     public CorsConfigurationSource corsConfigurationSource() {
         CorsConfiguration configuration = new CorsConfiguration();
         configuration.setAllowedOrigins(List.of("*"));
         
         configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
         configuration.setAllowedHeaders(List.of("*"));
         configuration.setAllowCredentials(false); 

         UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
         source.registerCorsConfiguration("/**", configuration);
         return source;
     }
}