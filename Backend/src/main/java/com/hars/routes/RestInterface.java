package com.hars.routes;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.hars.persistence.entities.User;
import com.hars.security.AuthenticationRequest;
import com.hars.security.AuthenticationResponse;
import com.hars.services.UserService;
import com.hars.utils.JwtUtil;


@SpringBootApplication
@RestController
public class RestInterface {

	@Autowired
	private UserService userService;

	@Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;
	
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

	@PostMapping("/authenticate")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthenticationRequest authenticationRequest) throws Exception {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authenticationRequest.getUsername(), authenticationRequest.getPassword())
        );

        final Optional<User> user = userService.checkUser(authenticationRequest.getUsername());
        final String jwt = jwtUtil.generateToken(user.get());

        return ResponseEntity.ok(new AuthenticationResponse(jwt));
    }


}
