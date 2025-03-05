package com.hars.webInterface;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.hars.backend.MqttClientAWS;

@Controller
public class HomeController {

    // Display the page with the button
    @GetMapping("/button")
    public String showButtonPage() {
        return "button-page"; // Refers to button-page.html
    }

    // Display the page with the input box and button
    @GetMapping("/input")
    public String showInputPage() {
        return "input-page"; // Refers to input-page.html
    }

    /*
    // Handle the button click
    @PostMapping("/handleButtonClick")
    public String handleButtonClick(@RequestParam(name = "action", required = false) String action, Model model) {
        if ("click".equals(action)) {
            // Call your Java function here
            String result = MqttClientAWS.main();
            model.addAttribute("message", result);
        }
        return "button-page"; // Return to the same page with a message
    }

    // Java function to be called
    private String performAction() {
        return "Button clicked! Java function executed.";
    }*/

    // Handle the form submission
    @PostMapping("/handleInput")
    public String handleInput(@RequestParam(name = "userInput", required = false) String userInput, Model model) {
        if (userInput != null && !userInput.isEmpty()) {
            // Call your Java function here with the input value
            //String result = processInput(userInput);
            String result = MqttClientAWS.main();
            model.addAttribute("result", result);
        } else {
            model.addAttribute("result", "No input provided!");
        }
        model.addAttribute("userInput", userInput); // Pass the input back to the page
        return "input-page"; // Return to the same page with the result
    }

    // Java function to process the input
    private String processInput(String input) {
        return "Processed input: " + input.toUpperCase(); // Example: Convert input to uppercase
    }
}