package com.hars.persistence.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hars.persistence.entities.Ownership;

@Repository
public interface OwnershipRepository extends JpaRepository<Ownership, Long> {
    Optional<Ownership> findByUsername(String username);
}
