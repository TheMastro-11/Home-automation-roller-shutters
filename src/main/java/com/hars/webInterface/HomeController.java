package com.hars.webInterface;

import java.util.ArrayList;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.hars.backend.MqttClientAWS;

@Controller
public class HomeController {

    @PostMapping("/submit-control")
    public String submitInput(@RequestParam int mode, @RequestParam int step, Model model) {
        try {
            MqttClientAWS.sendControl(mode, step);
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        // Process the input (e.g., save to database, perform some logic)
        String response = "You submitted: " + mode;
        model.addAttribute("response", response);
        return "index"; // Return to the same page
    }

    @GetMapping("/retrieve-output")
    public String retrieveOutput(Model model) {
        // Retrieve some output (e.g., from a service or database)
        String response = "Retrieved output:";
        ArrayList<String> messages = new ArrayList<>();
        try {
            messages = MqttClientAWS.getStatus();
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        model.addAttribute("response", response + messages.get(messages.size()-1));
        return "index"; // Return to the same page
    }

}
