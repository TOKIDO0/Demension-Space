package com.example.service;

import com.example.entity.Project;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.mapper.ProjectMapper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service
public class ProjectService extends ServiceImpl<ProjectMapper, Project> {

    @Resource
    private ProjectMapper projectMapper;

}
