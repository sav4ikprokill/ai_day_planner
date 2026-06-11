package com.aiplanner.reports.repository;

import com.aiplanner.reports.domain.Job;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobRepository extends JpaRepository<Job, Long>, JobRepositoryCustom {
}

