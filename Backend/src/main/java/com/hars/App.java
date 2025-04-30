package com.hars;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@ComponentScan(basePackages = "com.hars")
@EntityScan("com.hars.persistence.entities")
@EnableJpaRepositories("com.hars.persistence.repository")
@EnableTransactionManagement
public class App {
	
	public static void main(String[] args) {
		SpringApplication.run(App.class, args);
	}


}
