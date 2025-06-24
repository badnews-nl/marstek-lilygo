'use strict';

const Homey = require('homey');

const capabilities = [
  "meter_power.charged",
  "meter_power.discharged",
  "measure_battery",
  "measure_power",
  "charge_mode",
  "battery_capacity"
]

module.exports = class MarstekLilygoDriver extends Homey.Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.ds = { capabilities };
    this.log('MarstekLilygoDriver has been initialized');
  }

  /**
   * onPairListDevices is called when a user is adding a device
   * and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  onPair(session) {

    let devices = [
        {
            "name": "My Device",
            "data": { "id": "abcd" },
            "settings": {
                "IPAddress": 'IPAddress',
            }
        }
    ]

    // this is called when the user presses save settings button in pair.html
    session.setHandler('get_devices', async (data) => {
        devices = data;
        return devices;
    });

    // this happens when user clicks away the pairing windows
    session.setHandler('disconnect', async (data) => {
        this.log("Marstek - Pairing is finished (done or aborted) ");
    })

} // end onPair
  
};
