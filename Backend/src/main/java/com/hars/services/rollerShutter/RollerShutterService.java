package com.hars.services.rollerShutter;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.hars.persistence.dto.rollerShutter.RollerShutterDTO;
import com.hars.persistence.entities.rollerShutter.RollerShutter;
import com.hars.persistence.repository.rollerShutter.RollerShutterRepository;

@Service
public class RollerShutterService {

    @Autowired
    private RollerShutterRepository rollerShutterRepository;

    public List<RollerShutterDTO> getAllRollerShutters(){
        try {
            return rollerShutterRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        } catch (Exception e) {
            throw e;
        }
    }
    
    public RollerShutter createRollerShutter(String name) {
        try {
            RollerShutter roller_shutter = new RollerShutter(name);
            return rollerShutterRepository.save(roller_shutter);
        } catch (Exception e) {
            throw e;
        }
    }

    public void deleteRollerShutter(Long id){
        try {
            RollerShutter rollerShutter = rollerShutterRepository.findById(id).get();
            rollerShutterRepository.delete(rollerShutter);
        } catch (Exception e) {
            throw e;
        }
    }  

    public RollerShutter patchNameRollerShutter(Long id, String name){
        try {
            RollerShutter rollerShutter = rollerShutterRepository.findById(id).get();
            rollerShutter.setName(name);
            rollerShutter = rollerShutterRepository.save(rollerShutter);
            return rollerShutter;
        } catch (Exception e) {
            throw e;
        }
    }

    public RollerShutter patchOpeningRollerShutter(Long id, int increase_value){
        try {
            RollerShutter rollerShutter = rollerShutterRepository.findById(id).get();
            int oldValue = rollerShutter.getPercentageOpening();
            rollerShutter.setPercentageOpening(increase_value + oldValue);
            rollerShutter = rollerShutterRepository.save(rollerShutter);
            return rollerShutter;
        } catch (Exception e) {
            throw e;
        }
    }

    @ServiceActivator(inputChannel = "mqttInboundChannel")
    public void mqttUpdateRollerShutter(Message<String> message) {
        //String topic = message.getHeaders().get(MqttHeaders.RECEIVED_TOPIC, String.class);
        String payload = message.getPayload();
        long id = 1;
        if (payload != null) {
            this.patchOpeningRollerShutter(id, 1);
        }
    }

    //Helpers
    private RollerShutterDTO convertToDTO(RollerShutter rollerShutter) {
        RollerShutterDTO dto = new RollerShutterDTO();
        dto.setId(rollerShutter.getID());
        dto.setName(rollerShutter.getName());
        dto.setPercentageOpening(rollerShutter.getPercentageOpening());
    
        return dto;
    }

    public RollerShutter loadRollerShutterByName(String name) throws UsernameNotFoundException {
        RollerShutter roller_shutter = rollerShutterRepository.findByName(name)
                .orElseThrow(() -> new UsernameNotFoundException("RollerShutter not found with name: " + name));

        return roller_shutter;
    }

    public RollerShutter loadRollerShutterById(Long id) {
        RollerShutter roller_shutter = rollerShutterRepository.findById(id).get();
        return roller_shutter;
    }

    public Boolean isPresentByName(String name){
        return rollerShutterRepository.findByName(name).isPresent();
    }

    public Boolean isPresentById(Long id){
        return rollerShutterRepository.findById(id).isPresent();
    }
    
}