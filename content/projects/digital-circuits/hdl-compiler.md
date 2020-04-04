---
title: "HDL Compiler"
subtitle: "Compiler for a self-invented hardware description language"
date: 2017-12-10T10:26:00+01:00
image: /images/hdl-compiler/code-and-sim.jpg
sourceLink: https://gitlab.com/maxkl2/hdl-compiler
featured: 2
---

A compiler written in Rust that compiles source code in a hardware description language which I developed myself. It produces files that can be read by [gitlab.com/maxkl2/LogicSimulator](https://gitlab.com/maxkl2/LogicSimulator), a web-based simulator for digital circuits.

I have written an extensive README containing a lot more details and instructions on how to use the compiler which is available on GitLab together with the source code: [gitlab.com/maxkl2/hdl-compiler](https://gitlab.com/maxkl2/hdl-compiler).

To ensure its correct functionality and to test its limits (especially regarding future optimizations) I have also written a 16-bit RISC core in this hardware description language: [gitlab.com/maxkl2/hdl-cpu](https://gitlab.com/maxkl2/hdl-cpu). The programs it executes can either be written by hand or created using a simple assembler I created for this purpose. This assembler, also written in Rust, can be found in the same repository as the cores HDL code.
