#version 460

#extension GL_ARB_shader_draw_parameters : enable
#define INV_PI 0.31830988618
#define PI   3.14159265358979323846264338327950288
#define EPSILON   0.001

layout( location = 0 ) in vec2 f_uvs;

//globals
struct LightData
{
    vec4 m_light_pos;
    vec4 m_radiance;
    vec4 m_attenuattion;
};

layout( std140, set = 0, binding = 0 ) uniform PerFrameData
{
    vec4      m_camera_pos;
    mat4      m_view;
    mat4      m_projection;
    mat4      m_view_projection;
    mat4      m_inv_view;
    mat4      m_inv_projection;
    mat4      m_inv_view_projection;
    vec4      m_clipping_planes;
    LightData m_lights[ 10 ];
    uint      m_number_of_lights;
} per_frame_data;

layout ( set = 0, binding = 1 ) uniform sampler2D i_position_and_depth;
layout ( set = 0, binding = 2 ) uniform sampler2D i_normal;
layout ( set = 0, binding = 3 ) uniform sampler2D i_noise;

layout( set = 0, binding = 4 ) uniform kernel {
    vec4 samples[64];
};


layout(location = 0) out vec4 out_ssao;


void main() 
{
    out_ssao = vec4( 1.0f );
}