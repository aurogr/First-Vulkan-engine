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

layout ( set = 0, binding = 1 ) uniform sampler2D i_albedo;
layout ( set = 0, binding = 2 ) uniform sampler2D i_position_and_depth;
layout ( set = 0, binding = 3 ) uniform sampler2D i_normal;
layout ( set = 0, binding = 4 ) uniform sampler2D i_material;
layout ( set = 0, binding = 5 ) uniform sampler2D i_ssao_blur;

layout(location = 0) out vec4 out_color;
layout(location = 1) out vec4 out_bloom;

float d_ggx_throwbridge_reitz(float NdotH, float roughness){
    float alpha = roughness * roughness;
    float alpha2 = alpha * alpha;
    float denom = (NdotH * NdotH) * (alpha2 - 1.0) + 1.0;
    denom = PI * denom * denom;

    return alpha2 / denom;
}

float g1(float k, float Ndot){
    float denom = Ndot * (1 - k) + k;

    return Ndot / denom;
}

float g_schlick(float roughness, float NdotV, float NdotL){
    float k = (roughness + 1) * (roughness + 1) / 8;
    return g1(k, NdotL) * g1(k, NdotV);
}

vec3 fresnel(vec3 F0, float VdotH){
    float exponent = -5.55473 * VdotH - 6.98316 * VdotH * VdotH;

    return F0 + (1.0 - F0) * exp2(exponent);
}

vec3 shadeMicrofacets(vec3 v, vec3 l, vec3 n, float metallic, float roughness, vec3 albedo){
    vec3 h = normalize(v + l);

    float VdotH = max(dot(v, h), 0.0); 
    float NdotV = max(dot(n, v), 0.0);
    float NdotL = max(dot(n, l), 0.0);
    float NdotH = max(dot(n, h), 0.0);

    vec3 F0 = mix(vec3(0.04), albedo, metallic);

    float D = d_ggx_throwbridge_reitz(NdotH, roughness);
    vec3 F = fresnel(F0, VdotH);
    float G = g_schlick(roughness, NdotV, NdotL);

    float denom = max(4.0 * NdotV * NdotL, EPSILON);

    vec3 spec = D*G*F / denom;

    vec3 kd = (1.0 - F) * (1.0 - metallic);
    vec3 diffuse = kd * albedo / PI;  

    return diffuse + spec; 
}

vec3 evalMicrofacets(){
    vec4 albedo       = texture( i_albedo  , f_uvs );
    vec3  n            = normalize( texture( i_normal, f_uvs ).rgb * 2.0 - 1.0 );    
    vec3  frag_pos     = texture( i_position_and_depth, f_uvs ).xyz;
    float metallic = texture(i_material, f_uvs ).y;
    float roughness = texture(i_material, f_uvs ).z;
    vec3  shading = vec3( 0.0 );
    float AmbientOcclusion = texture(i_ssao_blur, f_uvs).r;

    vec3 v = normalize( per_frame_data.m_camera_pos.xyz - frag_pos);

    for( uint id_light = 0; id_light < per_frame_data.m_number_of_lights; id_light++ )
    {
        LightData light = per_frame_data.m_lights[ id_light ];
        uint light_type = uint( floor( light.m_light_pos.a ) );
        switch( light_type )
        {
            case 0: //directional
            {
                vec3 l = normalize( -light.m_light_pos.xyz );

                vec3 shade = shadeMicrofacets(v, l, n, metallic, roughness, albedo.rgb);
                
                shading += max( dot( n, l ), 0.0 ) * light.m_radiance.rgb * (shade);
                break;
            }
            case 1: //point
            {
                vec3 l = light.m_light_pos.xyz - frag_pos;
                float dist = length( l );
                float att = 1.0 / (light.m_attenuattion.x + light.m_attenuattion.y * dist + light.m_attenuattion.z * dist * dist );
                vec3 radiance = light.m_radiance.rgb * att;
                l = normalize(l);
                
                vec3 shade = shadeMicrofacets(v, l, n, metallic, roughness, albedo.rgb);

                shading += max( dot( n, l ), 0.0 ) * (shade) * radiance;
                break;
            }
            case 2: //ambient
            {
                shading += light.m_radiance.rgb * albedo.rgb * AmbientOcclusion;
                break;
            }
        }
    }

    return shading;
}

void main() 
{
    vec4 albedo       = texture( i_albedo  , f_uvs );
    vec3 hdr_color = evalMicrofacets();
    
    out_color = vec4(hdr_color, 1.0f);

    float brightness = dot(albedo.rgb, vec3(0.2126, 0.7152, 0.0722)); // Luminance calculation
                                                                      // we take the albedo because it is an emissive material, so it is the one that contributes to bloom, not the shaded color
    if (brightness > 1.0) {
        out_bloom = vec4(hdr_color, 1.0); // Store bright areas for bloom
    } else {
        out_bloom = vec4(0.0); // No bloom contribution
    }
}