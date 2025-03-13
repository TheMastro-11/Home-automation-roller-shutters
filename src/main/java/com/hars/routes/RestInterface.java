package com.hars.routes;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.hars.persistence.entities.User;
import com.hars.services.UserService;

@SpringBootApplication
@RestController
public class RestInterface {

	@Autowired
	private UserService userService;
	
	public static void main(String[] args) {
		SpringApplication.run(RestInterface.class, args);
	}

	@GetMapping("/")
	public String getValue(){
		return "";
	}

	@PostMapping("/RegisterUser")
	public String registerUser(@RequestBody User user){
		return userService.registerUser(user);
	}

	@PostMapping("/LoginUser")
	public String loginUser(@RequestBody User user){
		return userService.loginUser(user);
	}


}
