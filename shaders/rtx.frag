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

vec3 getConeSample(inout uint randSeed, vec3 direction, float coneAngle) {
    float r = nextRandFloat(randSeed);
    float phi = nextRandFloat(randSeed) * 2.0 * PI;
    
    float diskRadius = tan(coneAngle) * r;
    float x = diskRadius * cos(phi);
    float y = diskRadius * sin(phi);
    
    vec3 zAxis = normalize(direction);
    vec3 xAxis = normalize(cross(abs(zAxis.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0), zAxis));
    vec3 yAxis = cross(zAxis, xAxis);
    
    return normalize(zAxis + x * xAxis + y * yAxis);
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
                for (uint j = 0; j < push.soft_shadows_ray_number; j++) // multiple rays
                {
                    vec3 perpRay = cross(rayVector, vec3(0.0, 1.0, 0.0));

                    if (perpRay.x == 0 && perpRay.y == 0 && perpRay.z == 0) {
                        perpRay.x = 1.0;
                    }

                    vec3 rayToLightEdge = normalize((lightPos + perpRay * push.cone_radius) - biasedRayOrigin);
                    float coneAngle = acos(dot(normalize(rayVector), normalize(rayToLightEdge)));

                    uvec2 pixelCoords = uvec2(gl_FragCoord.xy);
                    uint randSeed = pixelCoords.x * 1973u + pixelCoords.y + j * 1337u;

                    rayDirection = getConeSample(randSeed, rayVector, coneAngle);
                    
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