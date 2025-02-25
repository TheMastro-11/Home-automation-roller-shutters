# Home-automation-roller-shutters

Management of a home automation system for controlling roller shutters:
- The system involves the use of devices equipped with a stepper motor and a light sensor light sensor, to control and automate the windows of a house. The readings are stored in an AWS database and managed according to the shadow things paradigm paradigm (foreseeing scalability at both dwelling and managed window level);
- The device, for each window, is able to open or close the shutter, or position it at intermediate heights. Basically, it adjusts the shutter depending on external light conditions, lowering it in direct sunlight, or closing it at night;
- The owner, via a web interface, can view the status of all shutters, programme automatic closing or opening by time slots, or adjust manually adjust the position of each one (also allowing global opening or closing). global opening or closing).
