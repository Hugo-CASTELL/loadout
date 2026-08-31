FROM postgres:15

RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-15-cron \
    && rm -rf /var/lib/apt/lists/* \
    && echo "shared_preload_libraries='pg_cron'" >> /usr/share/postgresql/postgresql.conf.sample
