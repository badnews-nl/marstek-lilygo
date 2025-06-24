'use strict';

const Homey = require('homey');
const request = require('request');

module.exports = class MyDevice extends Homey.Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('MyDevice has been initialized');
    global.myCounter = 0
    let pollingInterval = 15
    let settings = this.getSettings();
    this.ipaddress = settings.IPAddress
    this.myCounter=0
    this.doPollmodulo10()
    await this.registerListeners();
    await this.startPolling(pollingInterval);

    this.set
  }
  async setCapability(capability, value) {
    if (this.hasCapability(capability) && value !== undefined) {
      await this.setCapabilityValue(capability, value)
        .catch((error) => {
          this.log(error, capability, value);
        });
    }
  }
  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('MyDevice has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('MyDevice settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('MyDevice has been deleted');
    await this.stopPolling();
    this.log(`${this.getName()} has been deleted`);
  }

  async onUninit() {
    await this.stopPolling();
    this.log(`${this.getName()} uninit`);
  }
  
  async stopPolling() {
    this.log(`Stop polling ${this.getName()}`);
    this.homey.clearInterval(this.intervalIdDevicePoll);
  }

  async startPolling(interval) {
    this.homey.clearInterval(this.intervalIdDevicePoll);
    this.log(`start polling ${this.getName()} @${interval} seconds interval`);
    await this.doPoll();
    
    this.intervalIdDevicePoll = this.homey.setInterval(async () => {
      await this.doPoll();
    }, interval * 1000);

  }

  doPoll() {
    try {
      if (this.busy) {
        this.log('still busy. skipping a poll');
        return;
      }
 
    
      this.busy = true;
      this.myCounter += 1; 
      //console.log('this.myCounter  '+this.myCounter )
      if (this.myCounter % 20 == 0) {
        this.doPollmodulo10()
      }
      //marstek_battery_total_energy
      this.fetchESPLilygo(this.ipaddress,[['marstek_battery_total_energy','battery_capacity','sensor'],
                                           ['marstek_daily_charging_energy','meter_power.charged','sensor'],
                                           ['marstek_daily_discharging_energy','meter_power.discharged','sensor'],
                                           ['marstek_battery_remaining_capacity','measure_battery','sensor'],
                                           ['marstek_ac_power','measure_power','sensor']])
      this.busy = false;
    } catch (error) {
      this.busy = false;
      this.watchDogCounter -= 1;
      this.error('Poll error', error.message);
    }
  }
  doPollmodulo10() {
    try {
      //marstek_battery_total_energy
      this.fetchESPLilygo(this.ipaddress,[['marstek_user_work_mode','charge_mode','select']])
      //this.log("doPollmodulo10 finished")
    } catch (error) {
      this.busy = false;
      this.watchDogCounter -= 1;
      this.error('Poll error', error.message);
    }
  }  

  fetchESPLilygo(url, values) {
    for(const valuePair of values){

    let myUrl = 'http://'+url+'/'+valuePair[2]+'/'+valuePair[0]
    let myOptions = {json: true};
    request(myUrl, myOptions, (error, res, body) => {
      if (error) {
          return  console.log(error)
      };
  
      if (!error && res.statusCode == 200) {
        let myValue = body.value


        if (valuePair[1] == 'measure_power') {
          myValue = myValue * -1;

        } else if (valuePair[1] == 'charge_mode') {

          if (myValue == 'anti-feed') {
            myValue = 'SELF'
          } else if (myValue == 'anti-ai') {
            myVallue = 'AI'
          } else {
            myValue = 'MANUAL'
          }
          
        } else if (valuePair[1] == 'measure_battery') {
          myValue = (myValue/this.getCapabilityValue('battery_capacity'))*100

        }
        //this.log(valuePair[0]+' with '+valuePair[1]+' got a result of '+myValue)
        this.setCapability(valuePair[1], myValue);
        this.set            
      };
    });
  }
  }
  
  // register capability listeners
  registerListeners() {
    try {
      if (this.listenersSet) return true;
      this.log('registering listeners');

      // capabilityListeners will be overwritten, so no need to unregister them
      this.registerCapabilityListener('control_strategy', (strategy) => this.setControlStrategy(strategy, 'app'));
      this.registerCapabilityListener('charge_mode', (chargeMode) => this.setChargeMode(chargeMode, 'app'));
      this.registerCapabilityListener('meter_setpoint', (setpoint) => this.setPowerSetpoint(setpoint, 'app'));
      this.registerCapabilityListener('volume_set', (setpoint) => this.setAllowedNoiseLevel(setpoint, 'app'));

      this.listenersSet = true;
      return Promise.resolve(true);
    } catch (error) {
      return Promise.reject(error);
    }
  }
};
