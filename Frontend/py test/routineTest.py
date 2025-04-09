import auth, home, rollerShutter, lightSensor, routine; 
import time   

if __name__ == "__main__":
    # Register a new user
    auth.register_user("ma", "aaaa")

    # Authenticate the user and get a JWT token
    jwt_token = auth.authenticate_user("ma", "aaaa")
    
    
    print("HOME CREATE")
    home.createHome(jwt_token, "Trudda")
    time.sleep(0.5)
    print("LIGHT SENSOR CREATE")
    lightSensor.createLightSensor(jwt_token, "SensoreLuce", "Trudda")
    print("ROLLER SHUTTER CREATE")
    rollerShutter.createRollerShutter(jwt_token, "Finestra", "Trudda")
    time.sleep(0.5)
    print("CREATE ROUTINE")
    lightSensor_ = {
        "name" : "SensoreLuce"
    }
    lightSensor2 = {
        "name" : "SensoreLucio"
    }
    rollerShutter = {
        "name" : "Finestra"
    }
    rollerShutter2 = {
        "name" : "Finestra2"
    }
    routine.createRoutineLightSensor(jwt_token, "Accensione Luce", lightSensor_, [rollerShutter])
    time.sleep(0.5)
    print("PATCH NAME ROUTINE")
    routine.patchNameRoutine(jwt_token, 1, "Accendo Luce")
    time.sleep(0.5)
    #input("WAIT")
    print("LIGHT SENSOR DELETE")
    lightSensor.deleteLightSensor(jwt_token, 1)
    time.sleep(0.5)
    #input("WAIT")
    print("LIGHT SENSOR CREATE 2")
    lightSensor.createLightSensor(jwt_token, "SensoreLucio", "Trudda")
    time.sleep(0.5)
    print("PATCH LIGHT SENSOR")
    routine.patchLightSensorRoutine(jwt_token, 1, lightSensor2)
    time.sleep(0.5)
    print("PATCH ROLLER SHUTTERS ROUTINE")
    routine.patchRollerShutterRoutine(jwt_token, 1, [rollerShutter, rollerShutter2])
    print("DELETE ROUTINE")
    routine.deleteRoutine(jwt_token, 1)