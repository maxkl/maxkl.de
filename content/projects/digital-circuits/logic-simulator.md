---
title: "Logic Simulator"
subtitle: "A simulator for digital circuits"
date: 2020-03-15T16:32:46+01:00
image: /images/logic-simulator/simulation-mode.jpg
link: https://maxkl.de/LogicSimulator/
sourceLink: https://gitlab.com/maxkl2/LogicSimulator
---

This is a web application for editing and simulating digital circuits.

The simulator uses a cycle-based algorithm: each component is evaluated once per simulation cycle. It does not account for the propagation delay of wires or components. At the moment, the simulation speed is fixed to the screen refresh rate. However, the plan is to run the simulation in a background thread (web worker) in the future, which would make much higher simulation speeds possible.

I've implemented all the basic logic gates, and a few more complex components. It's also possible to create custom components from the existing ones.

Circuits can be saved locally as JSON files. Currently, there is no way to save them online.

The ultimate goal for me is to implement a CPU inside this simulator. This would definitely be possible at the moment, but I'd like to improve the editor and the simulation algorithm first, to make it a bit easier.

## Gallery

{{< gallery >}}
    {{< figure src="/images/logic-simulator/simulation-mode.jpg" >}}
    {{< figure src="/images/logic-simulator/edit-mode.jpg" >}}
    {{< figure src="/images/logic-simulator/component-overview.jpg" >}}
{{< /gallery >}}
