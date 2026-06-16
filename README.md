# Real-Time Vulkan Rendering Engine
This is a university project for the 'Advanced Rendering II' course, part of the Master's Degree in Computer Graphics, Games and Virtual Reality at Rey Juan Carlos University (URJC).
The project contains a Vulkan engine, the skeleton was provided by the course professors, where I implemented all the functionalities listed below.

# Key Features

## Physically Based Rendering (PBR)
Integrated a custom material pipeline stage within the deferred shading architecture given, to evaluate surfaces using a physically accurate reflection model. 

The result is a physically based BRDF where the diffuse component is modeled via a standard energy-conserving Lambertian model, and the specular component is modeled with microfacets utilizing the specular Cook-Torrance framework. Object properties are packed tightly into the G-Buffer (Channel R: Material ID, G: Roughness, B: Metallic, A: Alpha Masking).

<p align="center">
<img height="200" alt="pbr" src="https://github.com/user-attachments/assets/bca2a142-c3a7-47af-ab58-2b4f6ca0b9e2" />
</p>

## Early Depth Pre-Pass Rendering
Designed a render pass (`DepthPrePassVK`) that runs before processing the main G-Buffer. This pipeline strips out color attachments entirely and purely runs a vertex shader stage across scene objects to establish early hardware depth-buffer bounds, preventing unnecessary pixel processing in later passes.

<p align="center">
<img height="200" alt="depth_buffer_renderdoc" src="https://github.com/user-attachments/assets/01511746-f909-4220-95bb-9925cfa19dcc" />
</p>

## Screen Space Ambient Occlusion (SSAO)
SSAO aproximattes indirect light, shadowing geometry near other surfaces where rays are expected to stay stuck, not bouncing towards a light source. 

In the engine, two new passess where added for SSAO.
* **Occlusion Calculation Pass:** Projects random rays in a hemisphere around each pixel to see how "trapped" or blocked it is by nearby geometry, calculating the raw ambient shadows. Because it uses a randomized sampling pattern, the output has a noise pattern.  
* **Bilateral Blur Pass (`SSAOBlurPassVK`):** Mitigates the noise via an edge-preserving bilateral depth smoothing filter.

<table align="center">
  <tr align="center">
    <td align="center">
      <b>No SSAO</b><br />
      <img width="546" height="427" alt="nossao" src="https://github.com/user-attachments/assets/82ed5d1c-3425-4e26-b252-25181f2e57a5" />
    </td>
    <td align="center">
      <b>With SSAO</b><br />
<img width="547" height="430" alt="withssao" src="https://github.com/user-attachments/assets/841044da-3591-4a07-98c1-d1701c4b2de4" />
    </td>
  </tr>
</table>

## ImGui interface
Added an interactive interface using **Dear ImGui** to tweak rendering parameters on the fly. This allows the user to switch between shadow techniques and adjust post-processing effects (like bloom intensity and exposure) in real time to see their immediate visual impact.

## High Dynamic Range (HDR) Post-Processing Chain
**ACES Filmic Tone Mapping & Exposure Control:** Replaced basic LDR clamping loops with industry-standard **ACES (Academy Color Encoding System) Filmic**. Enabled exposure control parameter from the mentioned interface.  
**Multi-Pass Ping-Pong Bloom:** Isolated glowing image values exceeding an emissive color threshold into a separate lighting buffer. This texture undergoes a highly efficient multi-pass horizontal and vertical **Gaussian Ping-Pong Blur** (`BloomBlurPassVK`) using alternating framebuffers before it is overlaid onto the final color map. The number of ping-pong passes can be changed on the fly from the interface.  
**Chromatic Aberration Pass:** Simulated real-world optical camera lens refraction errors.  

<p align="center">
<img height="400" alt="image" src="https://github.com/user-attachments/assets/ea67d4b0-6250-4c00-af68-ea2996e87a73" />
</p>

## Real-Time Shadows

### 1. Shadow Mapping
**- Multi-Layered Framebuffer Object (FBO):** Implemented a high-precision multi-layered depth attachment (`mShadowAttachment`) using 2D Array formatting (`VK_FORMAT_D32_SFLOAT`).  

**- Single-Pass Geometry Broadcast:** Leveraged an explicit geometry shader wrapper to replicate mesh primitives onto every active light projection plane within a single drawing sequence, bypassing CPU draw call limitations across multiple scene lights.  

**- Slope-Dependent Dynamic Bias:** Intercepted surface rasterization artifacts ("shadow acne") by configuring active depth-biasing matrices triggered through real-time push commands (`vkCmdSetDepthBias`) mapping the direct inclination of the incident light source.  

**- Hardware & Software Percentage-Closer Filtering (PCF):** Combined high-efficiency bilinear texture hardware samples (`sampler2DArrayShadow`) with custom configurable multi-pixel software kernel filters inside the fragment shader filtered shadow borders.

<table align="center">
  <tr align="center">
    <td align="center">
      <b>Hard shadows with shadow mapping</b><br />
<img width="1015" height="954" alt="image" src="https://github.com/user-attachments/assets/72acde59-718f-494b-8247-5e1d5f2cd103" />
    </td>
    <td align="center">
      <b>Soft shadows with shadow mapping</b><br />
<img width="1017" height="956" alt="image" src="https://github.com/user-attachments/assets/c6c34790-8a48-4f20-9b86-c85fa8ae8ad6" />
    </td>
  </tr>
</table>

### 2. RTX Ray-Traced Shadows
**- Bottom-Level Acceleration Structures (BLAS) and Top-Level Acceleration Structures (TLAS) management:** Created the needed acceleration structures for ray sampling with RTX inside the fragment shaders.  

**- Cone Sampling via Vogel Disk (Soft Shadows):** Implemented area-light approximations by scattering secondary shadow rays across an explicit cone distribution. Used a Vogel disk sampling method to maximize uniform point layouts, which lowers the noise when using only a few rays per pixel.

**- Floating-Point Self-Occlusion Prevention:** Offshifted ray origin positions outward along surface normals to counteract floating-point accuracy breakdown and prevent surface acne along low angles.

**- Bilateral Shadow Denoising Filter:** Created a dedicated edge-aware bilateral blur pass over raw ray-traced shadows.

Future work in this area will revolve around building a spatio-temporal denoiser, which is expected to drastically reduce noise, even when using just a single ray per pixel.

<table align="center">
  <tr align="center">
    <td align="center">
      <b>RTX Hard shadows</b><br />
<img width="1012" height="946" alt="image" src="https://github.com/user-attachments/assets/3061d48e-b076-4751-a02f-dee7cd7380cd" />
    </td>
    <td align="center">
      <b>RTX Soft shadows</b><br />
<img width="1016" height="947" alt="image" src="https://github.com/user-attachments/assets/a69efbe9-1f5a-45d8-9953-874007f97c30" />
    </td>
  </tr>
</table>

# Build
CMake configuration files (`CMakeLists.txt`) are included in the project, allowing you to easily configure, build, and compile the entire engine straight from the command line.





