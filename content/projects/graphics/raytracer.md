---
title: "Raytracer"
subtitle: "CPU-based multi-platform raytracing renderer"
date: 2022-02-22
image: /images/raytracer/hero.png
link: https://projects.maxkl.de/raytracer/
sourceLink: https://gitlab.com/maxkl2/raytracer
featured: 4
---

A simple 3D raytracing renderer that implements the following features:

- Basic shapes (planes, spheres)
- 3D meshes loaded from .obj files, with mesh data stored in k-d trees to speed up ray-mesh intersection tests
- Texture mapping
- Accurate reflection and refraction using the Fresnel equations
- Directional and point light sources
- Environment mapping
- Supersampling anti-aliasing
- Parallelized rendering

As the renderer doesn't employ fully-fledged path tracing, there are no convergence issues and render times are comparatively low (under a minute to a few minutes depending on scene complexity). However, this also means that it doesn't support global illumination, area lights, soft shadows, depth of field and other similar effects.

The raytracer itself is implemented as a Rust library to be able to take advantage of the language's cross-platform capabilities. Two separate projects allow using the renderer on desktop operating systems (Linux, MacOS, Windows) ([gitlab.com/maxkl2/raytracer_ui](https://gitlab.com/maxkl2/raytracer_ui)) and in any browser supporting WebAssembly ([gitlab.com/maxkl2/raytracer_web](https://gitlab.com/maxkl2/raytracer_web)).

Some inspiration and ideas have been taken from the ["Physically Based Rendering" book](https://www.pbr-book.org/).

## Gallery

{{< gallery >}}
    {{< figure src="/images/raytracer/demo.png" caption="Spheres of different materials, a low-poly mesh and three colored directional lights above a textured plane" >}}
    {{< figure src="/images/raytracer/web.png" caption="Simple scene rendered in the browser" >}}
    {{< figure src="/images/raytracer/wineglass.png" caption="High-resolution mesh (4608 faces)" >}}
    {{< figure src="/images/raytracer/ui-linux.png" caption="Desktop UI with a render in progress" >}}
    {{< figure src="/images/raytracer/kdtree.png" caption="Visualization of the number of lookups in the k-d tree used to speed up ray-mesh intersection tests" >}}
{{< /gallery >}}
