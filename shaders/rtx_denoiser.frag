#version 460

#extension GL_ARB_shader_draw_parameters : enable
#extension GL_EXT_ray_query : enable
#define INV_PI 0.31830988618
#define PI   3.14159265358979323846264338327950288
#define EPSILON   0.01

layout( location = 0 ) in vec2 f_uvs;

/*layout (push_constant) uniform Block {
    uint soft_shadows;
} push;*/

layout ( set = 0, binding = 0 ) uniform sampler2D i_position_and_depth;
layout ( set = 0, binding = 1 ) uniform sampler2D i_normal;
layout ( set = 0, binding = 2 ) uniform sampler2D i_rtx_shadows;

layout(location = 0) out vec4 out_rtx_shadows;

void main() 
{
    vec4 shadowData = texture(i_rtx_shadows, f_uvs);

    out_rtx_shadows = vec4(vec3(shadowData), 1.0);
}