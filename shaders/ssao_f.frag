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

const float NOISE_SCALE = 4.0; // noise texture tiling (4x4)
const float KERNEL_SIZE = 64;
const float RADIUS = 0.5;
const float BIAS = 0.025;

void main() 
{
    vec3 fragPos = texture(i_position_and_depth, f_uvs).xyz;
    vec3 normal  = normalize(texture(i_normal, f_uvs).rgb);
    vec3 randomVec = texture(i_noise, f_uvs * NOISE_SCALE).xyz;

    // (Gramm-Schmidt process) create an orthogonal basis, each time slightly tilted based on the value of randomVec
    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);

    float occlusion = 0.0;

    // iterate over each of the kernel samples
    for(int i = 0; i < KERNEL_SIZE; ++i)
    {
        // get sample position
        vec3 samplePos = TBN * samples[i].xyz; // from tangent to view-space
        samplePos = fragPos + samplePos * RADIUS; // add them to the current fragment position

        // transform sample position from view-space to screen-space using projection matrix
        vec4 offset = vec4(samplePos, 1.0);
        offset = per_frame_data.m_projection * offset;
        offset.xyz /= offset.w;
        offset.xyz /= offset.xyz * 0.5 + 0.5;

        // transform to [0.0, 1.0] range so we can use them to sample the position texture
        float sampleDepth = texture(i_position_and_depth, offset.xy).z; 

        // check if the sample's current depth value is larger than the stored depth value and if so, we add to the final contribution factor
        occlusion += (sampleDepth >= samplePos.z + BIAS ? 1.0 : 0.0); 

        // range check that makes sure a fragment contributes to the occlusion factor if its depth values is within the sample's radius
        float rangeCheck = smoothstep(0.0, 1.0, RADIUS / abs(fragPos.z - sampleDepth));
        occlusion+= (sampleDepth >= samplePos.z + BIAS ? 1.0 : 0.0) * rangeCheck;  
    }

    occlusion = 1.0 - (occlusion / float(KERNEL_SIZE));
    occlusion = clamp(occlusion, 0.0, 1.0);

    // output as grayscale in RGB, alpha = 1
    out_ssao = vec4(vec3(occlusion), 1.0);
}