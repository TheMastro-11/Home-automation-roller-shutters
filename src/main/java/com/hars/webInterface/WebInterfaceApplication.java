package com.hars.webInterface;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
//import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
//@ComponentScan(basePackages = {"com.hars.controller"})
public class WebInterfaceApplication {

	public static void main(String[] args) {
		SpringApplication.run(WebInterfaceApplication.class, args);
		
	}

}
