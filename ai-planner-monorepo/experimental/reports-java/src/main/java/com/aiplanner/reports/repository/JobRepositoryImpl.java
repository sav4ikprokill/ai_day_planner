package com.aiplanner.reports.repository;

import com.aiplanner.reports.domain.Job;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public class JobRepositoryImpl implements JobRepositoryCustom {

    private static final String ACQUIRE_SQL = """
        WITH job_to_process AS (
            SELECT id
            FROM jobs
            WHERE status = 'pending'
              AND task_type = 'generate_report'
            ORDER BY created_at ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 1
        )
        UPDATE jobs
        SET status = 'processing', updated_at = NOW()
        WHERE id IN (SELECT id FROM job_to_process)
        RETURNING *
        """;

    private static final String UPDATE_STATUS_SQL = """
        UPDATE jobs
        SET status = :status, updated_at = NOW()
        WHERE id = :id
        """;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Optional<Job> acquireNextReportJob() {
        List<Job> jobs = entityManager
            .createNativeQuery(ACQUIRE_SQL, Job.class)
            .getResultList();

        if (jobs.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(jobs.get(0));
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateJobStatus(Long jobId, String status) {
        entityManager
            .createNativeQuery(UPDATE_STATUS_SQL)
            .setParameter("id", jobId)
            .setParameter("status", status)
            .executeUpdate();
    }
}
