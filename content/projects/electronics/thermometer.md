---
title: "Precision Thermometer"
subtitle: "A precise battery-powered thermometer + hygrometer"
date: 2021-08-02T20:11:00+02:00
image: /images/thermometer/showcase.jpg
sourceLink: https://gitlab.com/maxkl2/PreciseTemp
featured: 0
---

<!--## Description-->

<!-- Motivation -->
The idea for this combined thermometer and hygrometer came from the desire for a way to determine the best way to cool my shared attic flat in the summer. It should be able to measure temperatures down to a minimum precision of 0.1 °C and react quickly to changes in the ambient temperature. I wanted it to be small and portable, with a battery life long enough so that I didn't have to worry about replacing the battery too often even with regular use. In addition, a simple data logging functionality would be nice.

<!--more-->

## Gallery

{{< gallery >}}
	{{< figure src="/images/thermometer/showcase.jpg" caption="Fully assembled thermometer in use" >}}
	{{< figure src="/images/thermometer/datalog.png" caption="Data log of temperature and relative humidity recorded by the device" >}}
	{{< figure src="/images/thermometer/front.jpg" caption="PCB front side" >}}
	{{< figure src="/images/thermometer/back.jpg" caption="PCB back side" >}}
	{{< figure src="/images/thermometer/programming.jpg" caption="Programming and debugging using the custom pogo pin assembly" >}}
	{{< figure src="/images/thermometer/usb.jpg" caption="Connection to a PC over USB for data logging" >}}
	{{< figure src="/images/thermometer/freezer.jpg" caption="Measuring negative temperatures" >}}
	{{< figure src="/images/thermometer/schematic.png" caption="Schematic" >}}
{{< /gallery >}}

## Design details

<!-- Sensors -->
To achieve the desired specifications without requiring difficult calibration, fully integrated sensors with I²C interfaces were chosen. The temperature sensor is a [TMP117 by Texas Instruments](https://www.ti.com/lit/ds/symlink/tmp117.pdf) with guaranteed ±0.1 °C accuracy from -20 °C to 50 °C and a resolution of 0.0078 °C. The [HTU31D by TE](https://www.te.com/commerce/DocumentDelivery/DDEController?Action=showdoc&DocId=Data+Sheet%7FHTU31_RHT_SENSOR_IC%7F5%7Fpdf%7FEnglish%7FENG_DS_HTU31_RHT_SENSOR_IC_5.pdf%7FCAT-HSC0007) was selected as the humidity sensor. Its accuracy of ±2 %RH is good compared to other similar sensors and was deemed sufficient for the application.

<!-- Display (incl driving) -->
Due to its low power requirements, high contrast ratio and good viewing angle a reflective LCD was chosen. A simple 4-digit 7-segment display allows showing one measurement at a time. To be able to drive all of the segments with a small microcontroller, multiple 74-series shift registers are used in series, requiring only 4 microntroller pins.

<!-- Microcontroller incl data logging (-> FRAM, USB) -->
The key requirements for the microcontroller were low power consumption and the availability of an I²C interface for communication with the sensors, a synchronous serial peripheral (i.e. SPI) for driving the LCD and an asynchronous serial interface (i.e. UART) for communication with a PC for configuration. In addition, sufficient nonvolatile storage would enable data logging. The logged measurements can be transferred to a PC via the UART interface as well. Given these requirements, the choice fell on an [MSP430FR2476 from Texas Instruments](https://www.ti.com/lit/ds/symlink/msp430fr2476.pdf). It features several low power modes and 64 KiB of nonvolatile ferroelectric RAM (FRAM). It's low power consumption and high write endurance make this memory type much better suited for the application than the more common flash memory.
To make connection to a PC easier, a [Silicon Labs CP2102N](https://www.silabs.com/documents/public/data-sheets/cp2102n-datasheet.pdf) USB-to-UART converter was included on the PCB.

<!-- Power saving measures -->
The thermometer is powered by a single CR2032 coin cell. A buck-boost converter generates the required 3.3 V independent of the actual battery voltage. While connected via USB, bus power is used instead of the battery. As an additional power saving measure, when USB is not connected, the USB-to-UART converter is cut off from the supply voltage and the UART interface is disabled.

<!-- Enclosure -->
The protective enclosure was fabricated from 2 and 3 mm acrylic sheets by the laser cutting service [Formulor](https://www.formulor.de/).

