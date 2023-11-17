---
title: "Logic Simulator"
subtitle: "A simulator for digital circuits"
date: 2017-05-17T09:47:00+02:00
image: /images/logic-simulator/simulation-mode.jpg
link: https://projects.maxkl.de/LogicSimulator/
sourceLink: https://gitlab.com/maxkl2/LogicSimulator
featured: 3
---

This is a web application for editing and simulating digital circuits.

The simulator uses a cycle-based algorithm: each component is evaluated once per simulation cycle. It does not account for the propagation delay of wires or components. The simulation runs in a background worker process, which means that it can run at high speeds without affecting the user interface. However, it is also possible to tie the simulation speed to the screen refresh rate.

I have implemented all the basic logic gates, and a few more complex components such as counters or memory. It is also possible to graphically combine existing components into new ones.

The ultimate goal was to implement a CPU inside this simulator. See [HDL Compiler]({{< relref "hdl-compiler" >}}).

## Gallery

{{< gallery >}}
    {{< figure src="/images/logic-simulator/simulation-mode.jpg" >}}
    {{< figure src="/images/logic-simulator/edit-mode.jpg" >}}
    {{< figure src="/images/logic-simulator/component-overview.jpg" >}}
{{< /gallery >}}
