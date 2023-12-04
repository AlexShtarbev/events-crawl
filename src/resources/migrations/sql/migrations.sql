--liquibase formatted sql

--changeset alex_shtarbev:1
CREATE SCHEMA if not exists theatre_cralwer;

--changeset alex_shtarbev:2
CREATE TABLE IF NOT EXISTS theatre_cralwer.theatre_play (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    url text NOT NULL
)