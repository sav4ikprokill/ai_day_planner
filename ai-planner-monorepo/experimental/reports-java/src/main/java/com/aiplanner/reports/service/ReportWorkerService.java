package com.aiplanner.reports.service;

import com.aiplanner.reports.domain.Job;
import com.aiplanner.reports.repository.JobRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class ReportWorkerService {

    private static final Logger log = LoggerFactory.getLogger(ReportWorkerService.class);

    private final JobRepository jobRepository;
    private final ObjectMapper objectMapper;
    private final long simulateDelayMs;

    public ReportWorkerService(
        JobRepository jobRepository,
        ObjectMapper objectMapper,
        @Value("${reports.worker.simulate-delay-ms:2000}") long simulateDelayMs
    ) {
        this.jobRepository = jobRepository;
        this.objectMapper = objectMapper;
        this.simulateDelayMs = simulateDelayMs;
    }

    @Scheduled(fixedDelayString = "${reports.worker.poll-delay-ms:5000}")
    public void pollForReportJobs() {
        jobRepository.acquireNextReportJob().ifPresent(this::processJobSafely);
    }

    private void processJobSafely(Job job) {
        try {
            JsonNode payload = objectMapper.readTree(job.getPayload());
            long telegramId = resolveTelegramId(payload);

            Thread.sleep(simulateDelayMs);
            log.info("Report generated for user {} from job {}", telegramId, job.getId());

            jobRepository.updateJobStatus(job.getId(), "completed");
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            log.error("Report worker interrupted while processing job {}", job.getId(), error);
            jobRepository.updateJobStatus(job.getId(), "failed");
        } catch (Exception error) {
            log.error("Failed to process report job {}", job.getId(), error);
            jobRepository.updateJobStatus(job.getId(), "failed");
        }
    }

    private long resolveTelegramId(JsonNode payload) {
        JsonNode telegramIdNode = payload.path("telegram_id");
        if (telegramIdNode.isIntegralNumber()) {
            return telegramIdNode.asLong();
        }

        JsonNode taskIdNode = payload.path("user_id");
        if (taskIdNode.isIntegralNumber()) {
            return taskIdNode.asLong();
        }

        throw new IllegalArgumentException("Report job payload must contain telegram_id or user_id");
    }
}
