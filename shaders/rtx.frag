#version 460

#extension GL_ARB_shader_draw_parameters : enable
#extension GL_EXT_ray_query : enable
#define INV_PI 0.31830988618
#define PI   3.14159265358979323846264338327950288
#define EPSILON   0.01

layout( location = 0 ) in vec2 f_uvs;

layout (push_constant) uniform Block {
    uint soft_shadows;
    uint soft_shadows_ray_number;
    float cone_radius;
} push;

//globals
struct LightData
{
    vec4 m_light_pos;
    vec4 m_radiance;
    vec4 m_attenuattion;
    mat4 m_view_projection;
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
layout ( set = 0, binding = 3 ) uniform accelerationStructureEXT TLAS;

layout(location = 0) out vec4 out_rtx_shadows;

float evalVisibility(vec3 rayOrigin, vec3 rayDirection, float rayLength)
{
    rayQueryEXT query;
    
    rayQueryInitializeEXT(
        query, 
        TLAS, 
        gl_RayFlagsTerminateOnFirstHitEXT,
        0xFF,
        rayOrigin, 
        EPSILON, 
        rayDirection, 
        rayLength
    );
    
    while(rayQueryProceedEXT(query)) { }
    
    if(rayQueryGetIntersectionTypeEXT(query, true) != gl_RayQueryCommittedIntersectionNoneEXT)
    {
        return 0.0; 
    }
    
    return 1.0;
}

uint nextRand(inout uint seed) 
{
    seed = seed * 747796405u + 289133645u;
    uint word = ((seed >> ((seed >> 28u) + 4u)) ^ seed) * 277803737u;
    return (word >> 22u) ^ word;
}

float nextRandFloat(inout uint seed) 
{
    return float(nextRand(seed)) / 4294967295.0;
}

vec3 getVogelSample(inout uint randSeed, vec3 direction, float coneRadius, uint sampleIndex, uint totalSamples) 
{
    const float GOLDEN_ANGLE = 2.399963229728653; // 137.5 degrees in radians

    // disk is divided in rings of equal areas (totalSamples), with a theta offset by the golden angle
    float r = sqrt(float(sampleIndex) + 0.5) / sqrt(float(totalSamples));
    float theta = float(sampleIndex) * GOLDEN_ANGLE;

    // add random rotation to theta
    float randomRotation = nextRandFloat(randSeed) * 2.0 * PI;
    theta += randomRotation;

    // convert from polar coordinates to cartesian
    float x = coneRadius * r * cos(theta);
    float y = coneRadius * r * sin(theta);
    
    // transform from 2D disk to 3D world space aligned with light direction
    vec3 zAxis = normalize(direction);
    vec3 xAxis = normalize(cross(abs(zAxis.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0), zAxis));
    vec3 yAxis = cross(zAxis, xAxis);
    
    // return offset position on the physical light disk
    return zAxis + x * xAxis + y * yAxis;
}

void main() 
{
    bool softShadows = true;

    vec4 positionData = texture(i_position_and_depth, f_uvs);

    if (positionData.a == 0.0) // force bck to be black
    {
        out_rtx_shadows = vec4(0.0); 
        return;
    }
    
    vec3 worldPos = positionData.xyz;

    // loop through every active light and calculate the visibility of the fragment for each one
    uint lightsCount = per_frame_data.m_number_of_lights;
    float shadowLightsCount = 0.0;

    float accumulatedVisibility = 0.0;

    // get normal direction to move ray origin an epsilon in the direction of the normal
    // this helps with auto-occlusions problems, because if the light is almost perpendicular to mesh, because of float errors, it goes inside the mesh and casts a shadow
    // so we push oirigin outside in the normal direction so that it doesnt occlude itself
    vec3 normal = normalize( texture( i_normal, f_uvs ).rgb * 2.0 - 1.0 );
    vec3 biasedRayOrigin = worldPos + (normal * EPSILON);
    
    for (uint i = 0; i < lightsCount; ++i) 
    {
        uint light_type = uint( floor( per_frame_data.m_lights[i].m_light_pos.a ) ); 
        if (light_type != 2) // we don't count ambient light for shadows
        { 
            vec3 lightPos = per_frame_data.m_lights[i].m_light_pos.xyz;

            vec3 rayVector = lightPos - biasedRayOrigin;
            float rayLength = length(rayVector);
            vec3 rayDirection = vec3(0.0);

            if (push.soft_shadows == 1)
            {
                uvec2 pixelCoords = uvec2(gl_FragCoord.xy);
                uint randSeed = pixelCoords.x * 1973u + pixelCoords.y * 9277u;

                for (uint j = 0; j < push.soft_shadows_ray_number; j++) // multiple rays
                {
                    // get a random offset for the position on disk
                    vec3 sampleOffset = getVogelSample(randSeed, rayVector, push.cone_radius, j, push.soft_shadows_ray_number);

                    vec3 sampleLightPos = lightPos + sampleOffset;

                    vec3 sampleRayVector = sampleLightPos - biasedRayOrigin;
                    rayLength = length(sampleRayVector);
                    rayDirection = normalize(sampleRayVector);
                    
                    accumulatedVisibility += evalVisibility(biasedRayOrigin, rayDirection, rayLength);

                    shadowLightsCount++;
                }

            } else
            {
                rayDirection = normalize(rayVector);

                accumulatedVisibility += evalVisibility(biasedRayOrigin, rayDirection, rayLength);

                shadowLightsCount++;
            }            
        }
    }

    // normalize visibility by lights number
    float finalShadowFactor = accumulatedVisibility / shadowLightsCount;

    out_rtx_shadows = vec4(vec3(finalShadowFactor), 1.0);
}