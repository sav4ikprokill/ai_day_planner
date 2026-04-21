package com.aiplanner.reports.repository;

import com.aiplanner.reports.domain.Job;

import java.util.Optional;

public interface JobRepositoryCustom {

    Optional<Job> acquireNextReportJob();

    void updateJobStatus(Long jobId, String status);
}
