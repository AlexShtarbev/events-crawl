import { log } from 'crawlee';
import {
	LiquibaseConfig,
	Liquibase,
	POSTGRESQL_DEFAULT_CONFIG,
} from 'liquibase';

const config: LiquibaseConfig = {
	...POSTGRESQL_DEFAULT_CONFIG,
	url: 'jdbc:postgresql://localhost:5432/postgres',
	username: 'postgres',
	password: 'password',
    changeLogFile: 'src/resources/migrations/sql/migrations.sql'
};
const instance = new Liquibase(config);

async function doEet() {
	await instance.status();

    await instance.update({})
	// await instance.update();
	// await instance.dropAll();
}

doEet();