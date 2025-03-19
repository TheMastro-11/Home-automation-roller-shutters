package com.hars.routes;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;


@SpringBootApplication
@RestController
public class RestInterface {

	@GetMapping("/")
	public String getValue(){
		return "";
	}

	@PostMapping("/tmp")
	public String tmp(@RequestBody MyRequest user){
		return "ok";
	}


}
